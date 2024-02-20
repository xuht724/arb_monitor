import { TransferEvent } from "../eventDecoder/types/events";
import { EventDecoder } from "../eventDecoder/eventDecoder";
import { AllCyclesInDirectedGraphJohnson } from '../arbIdentification/loopHelper/AllCyclesInDirectedGraphJohnson'

export class TrxAnalyzer {
    static analyseAddressTokenNetProfit(events: TransferEvent[]) {
        let addressTokenProfitMap = new Map<string, Map<string, bigint>>();
        for (const event of events) {
            // Update profit for 'from' address
            if (addressTokenProfitMap.has(event.from)) {
                const fromMap = addressTokenProfitMap.get(event.from) as Map<string, bigint>;
                let fromProfit = BigInt(0);
                if (fromMap.has(event.address)) {
                    fromProfit = fromMap.get(event.address) as bigint;
                }
                fromProfit -= event.value;
                fromMap.set(event.address, fromProfit);
            } else {
                const fromMap = new Map<string, bigint>();
                fromMap.set(event.address, -event.value);
                addressTokenProfitMap.set(event.from, fromMap);
            }
            // Update profit for 'to' address
            if (addressTokenProfitMap.has(event.to)) {
                const toMap = addressTokenProfitMap.get(event.to) as Map<string, bigint>;
                let toProfit = BigInt(0);
                if (toMap.has(event.address)) {
                    toProfit = toMap.get(event.address) as bigint;
                }
                toProfit += event.value;
                toMap.set(event.address, toProfit);
            } else {
                const toMap = new Map<string, bigint>();
                toMap.set(event.address, event.value);
                addressTokenProfitMap.set(event.to, toMap);
            }
        }

        return addressTokenProfitMap
    }

    static analyseArb(txReceipt: any) {
        const transferEvents = EventDecoder.decodeErc20Transfers(txReceipt.logs);
        const addressTokenProfitMap = TrxAnalyzer.analyseAddressTokenNetProfit(transferEvents);

        let graph = new Map<string, string[]>();
        for(let i = 0; i < transferEvents.length - 1; i++){
            for(let j = i + 1; j < transferEvents.length; j++){
                if(transferEvents[i].address != transferEvents[j].address){
                    if(transferEvents[i].from == transferEvents[j].to && addressTokenProfitMap.get(transferEvents[i].from)!.size < 3){
                        if(graph.has(transferEvents[j].address)){
                            let temp = graph.get(transferEvents[j].address);
                            if(!temp?.includes(transferEvents[i].address)) temp?.push(transferEvents[i].address)
                            graph.set(transferEvents[j].address, temp?temp:[]);
                        }else{
                            graph.set(transferEvents[j].address, [transferEvents[i].address]);
                        }
                        if(!graph.has(transferEvents[i].address)) graph.set(transferEvents[i].address, []);
                    }
                    
                    if(transferEvents[i].to == transferEvents[j].from && addressTokenProfitMap.get(transferEvents[i].to)!.size < 3){
                        if(graph.has(transferEvents[i].address)){
                            let temp = graph.get(transferEvents[i].address);
                            if(!temp?.includes(transferEvents[j].address)) temp?.push(transferEvents[j].address)
                            graph.set(transferEvents[i].address, temp?temp:[]);
                        }else{
                            graph.set(transferEvents[i].address, [transferEvents[j].address]);
                        }
                        if(!graph.has(transferEvents[j].address)) graph.set(transferEvents[j].address, []);
                    }
                }
            }
        }

        const johnson = new AllCyclesInDirectedGraphJohnson();
        const circles = johnson.identifyCircle(graph);
        if(circles.length > 0){
            for(let circle of circles){
                let profit = 0n;
                for(let [address, tokenNet] of addressTokenProfitMap){
                    for(let [token, netValue] of tokenNet){
                        if(circle.includes(token))
                            profit = netValue > profit ? netValue : profit;
                    }
                }
                if(profit > 0n) 
                    return EventDecoder.decodeTrxSwapEvents(txReceipt.logs);
            }
        }
        return [];
    }
}