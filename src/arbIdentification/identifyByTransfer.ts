import { 
    Log, 
    decodeEventLog, 
    PublicClient,
    http,
    createPublicClient,
    getContract,
    getAddress,
    SetRpcUrlErrorType, 
} from 'viem';
import { mainnet } from "viem/chains";
import { TransferEvent } from '../eventDecoder/types/events'
import { EventsSignatureMap} from '../eventDecoder/constants/events'
import { EventDecoder } from '../eventDecoder/eventDecoder';
import { AllCyclesInDirectedGraphJohnson } from './loopHelper/AllCyclesInDirectedGraphJohnson';

export class identifyByTransfer{
    publicClient: PublicClient;

    constructor(HTTP_NODE_URL: string) {
        this.publicClient = createPublicClient({
            chain: mainnet,
            transport: http(HTTP_NODE_URL),
        });
    }

    public async identifyArbByTransfer(txReceipt: any, transferEvents: TransferEvent[]): Promise<[boolean, string[][], string[], bigint[]] | [boolean, undefined, undefined, undefined]>{
        let transferLogs = []
        for(let log of txReceipt.logs){
            if(log.topics[0] == EventsSignatureMap.Erc20_Transfer){
                transferLogs.push(log);
            }
        }
        const [netValues, addressRelatedTokensMap] = this.calculateNetValues(transferLogs, transferEvents);

        let graph = new Map<string, string[]>();
        for(let i = 0; i < transferEvents.length - 1; i++){
            for(let j = i + 1; j < transferEvents.length; j++){
                if(transferLogs[i].address != transferLogs[j].address){
                    if(transferEvents[i].from == transferEvents[j].to && addressRelatedTokensMap.get(transferEvents[i].from)!.length < 3){
                        if(graph.has(transferLogs[j].address)){
                            let temp = graph.get(transferLogs[j].address);
                            if(!temp?.includes(transferLogs[i].address)) temp?.push(transferLogs[i].address)
                            graph.set(transferLogs[j].address, temp?temp:[]);
                        }else{
                            graph.set(transferLogs[j].address, [transferLogs[i].address]);
                        }
                        if(!graph.has(transferLogs[i].address)) graph.set(transferLogs[i].address, []);
                    }
                    
                    else if(transferEvents[i].to == transferEvents[j].from && addressRelatedTokensMap.get(transferEvents[i].to)!.length < 3){
                        if(graph.has(transferLogs[i].address)){
                            let temp = graph.get(transferLogs[i].address);
                            if(!temp?.includes(transferLogs[j].address)) temp?.push(transferLogs[j].address)
                            graph.set(transferLogs[i].address, temp?temp:[]);
                        }else{
                            graph.set(transferLogs[i].address, [transferLogs[j].address]);
                        }
                        if(!graph.has(transferLogs[j].address)) graph.set(transferLogs[j].address, []);
                    }
                }
            }
        }

        const johnson = new AllCyclesInDirectedGraphJohnson();
        const circles = johnson.identifyCircle(graph);
        if(circles.length == 0) return [false, undefined, undefined, undefined];
        let pivots = [], maxProfits = [];
        for(let circle of circles){
            let maxProfit = 0n;
            let pivot = ''
            for(let token of circle){
                const netvalue = netValues.get(token)?.values();
                if(netvalue != undefined){
                    for(let value of netvalue){
                        if(value > maxProfit){
                            maxProfit = value;
                            pivot = token;
                        }
                    }
                }
                
            }
            pivots.push(pivot);
            maxProfits.push(maxProfit);
        }
        return [true, circles, pivots, maxProfits];
    }

    public calculateNetValues(transferLogs: Log[], transferEvents: TransferEvent[]): [Map<string, Map<string, bigint>>, Map<string, string[]>]{
        let netValues = new Map<string, Map<string, bigint>>(); // token -> ( address -> profit )
        let temp = new Map<string, Map<string, bigint[]>>(); // token -> ( address -> [net sent, net received] )
        let addressRelatedTokensMap = new Map<string, string[]>(); // address -> [related tokens]
        for(let i = 0; i < transferEvents.length; i++){
            let l = transferLogs[i], e = transferEvents[i], t;
            t = temp.get(l.address) != undefined ? temp.get(l.address)! : new Map<string, bigint[]>();

            let fromMap = t.get(e.from) != undefined ? t.get(e.from)! : [];
            if(fromMap.length == 0){
                fromMap.push(e.value);
                fromMap.push(0n);
            }else{
                fromMap[0] += e.value;
            }
            t.set(e.from, fromMap);
            
            let toMap = t.get(e.to) != undefined ? t.get(e.to)! : [];
            if(toMap.length == 0){
                toMap.push(0n);
                toMap.push(e.value);
            }else{
                toMap[1] += e.value;
            }
            t.set(e.to, toMap);

            if(t.size > 0) temp.set(l.address, t);

            if(addressRelatedTokensMap.has(e.from)){
                let tokens = addressRelatedTokensMap.get(e.from)!;
                if(!tokens.includes(l.address)){
                    tokens.push(l.address);
                    addressRelatedTokensMap.set(e.from, tokens);
                }
            }else{
                addressRelatedTokensMap.set(e.from, [l.address]);
            }

            if(addressRelatedTokensMap.has(e.to)){
                let tokens = addressRelatedTokensMap.get(e.to)!;
                if(!tokens.includes(l.address)){
                    tokens.push(l.address);
                    addressRelatedTokensMap.set(e.to, tokens);
                }
            }else{
                addressRelatedTokensMap.set(e.to, [l.address]);
            }
        }

        for(let [token, maps] of temp.entries()){
            let netMap = new Map<string, bigint>();
            for(let [address, arr] of maps.entries()){
                if(arr[0] > 0n && arr[1] > 0n && arr[1] - arr[0] > 0n) netMap.set(address, arr[1] - arr[0]);
            }
            netValues.set(token, netMap);
        }
        return [netValues, addressRelatedTokensMap];
    }
}