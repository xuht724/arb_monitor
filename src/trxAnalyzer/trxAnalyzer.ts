import * as fs from 'node:fs';
import * as path from 'node:path';
import { TransferEvent } from "../eventDecoder/types/events";
import { EventDecoder } from "../eventDecoder/eventDecoder";
import { HTTP_NODE_URL, sqlite_database, trxAnalyzerResultPath } from '../config';
import { WETHAddress } from "../constants/token";
import { AllCyclesInDirectedGraphJohnson } from '../arbIdentification/loopHelper/AllCyclesInDirectedGraphJohnson'
import { identifyByTransfer } from "../arbIdentification/identifyByTransfer";
import { identifyBySwap } from "../arbIdentification/identifyBySwap";

const replacer = (key: string, value: any) => {
    if (typeof value === "bigint") {
        return value.toString();
    } else if (value instanceof Map) {
        // Convert Map to a plain object
        const obj: { [key: string]: any } = {};
        value.forEach((v, k) => {
            obj[k.toString()] = v;
        });
        return obj;
    }
    return value;
};

// 通用的 reviver 函数，将所有纯数字字符串替换成 bigint
export function reviver(key: string, value: any): any {
	if (typeof value === 'string' && /^-?\d+$/.test(value)) {
		return BigInt(value); // 将纯数字字符串替换成 bigint
	} else if (typeof value === 'object') {
		// 递归调用 reviver 函数，处理嵌套的对象
		for (const k in value) {
			if (value.hasOwnProperty(k)) {
				value[k] = reviver(k, value[k]);
			}
		}
	}
	return value;
}

export class TrxAnalyzer {

    static loadData(infoPath: string) {
        const absPath = path.resolve(infoPath);
        if(fs.existsSync(absPath)){
            return JSON.parse(fs.readFileSync(absPath, "utf8"));
        }
        else{
            let temp = JSON.stringify({});
            fs.writeFile(absPath, temp, (err) => {
                if(err){
                    console.log('Error creating json:', err);
                }
            });
            return {};
        }
    }

    static writeData(infoPath: string, info: any) {
        const absPath = path.resolve(infoPath);
        const jsoninfo = JSON.stringify(info, replacer);
        fs.writeFileSync(absPath, jsoninfo);
    }

    static async batchGetBlock(startBlock: bigint, endBlock: bigint){
        let blockReqs = [];
        for(let i = startBlock; i < endBlock; i++){
            blockReqs.push({
                method: 'eth_getBlockByNumber',
                params: [`0x${i.toString(16)}`, false],
                id: 0,
                jsonrpc: '2.0'
            });
        }
        const blockRes = await fetch(HTTP_NODE_URL, {
            method: 'POST',
            body: JSON.stringify(blockReqs),
            headers: { 'Content-Type': 'application/json' }
        });
        const blocks = await blockRes.json();
        return blocks;
    }

    static async batchGetTrxReceipt(blocks: any){
        let promiseList = [];
        for(let i = 0; i < blocks.length; i++){
            const block = blocks[i].result;
            let trxReqs = [];
            for(let i = 0; i < block.transactions.length; i++){
                trxReqs.push({
                    method: 'eth_getTransactionReceipt',
                    params: [block.transactions[i]],
                    id: i,
                    jsonrpc: '2.0'
                });
            }
            promiseList.push(fetch(HTTP_NODE_URL, {
                method: 'POST',
                body: JSON.stringify(trxReqs),
                headers: { 'Content-Type': 'application/json' }
            }));
            //const trxReceipts = await trxRes.json();
        }
        const res = Promise.all(promiseList);
        return res;
    }

    static async analyse(blockNumber: bigint, trxRes: any){
        //const begin = performance.now();
        const node_fetch = await import('node-fetch');
        let trxAnalyzerResult = TrxAnalyzer.loadData(trxAnalyzerResultPath);
        if(trxAnalyzerResult[blockNumber.toString()] != undefined) return;

        let blockResult:any = {};
        blockResult["BlockNumber"] = blockNumber;
        let trxResults: any = [];
        let arbTrxResults: any = [];

        const trxReceipts = await trxRes.json();
        //const end = performance.now();
        //console.log(end - begin);
        const iByTransfer = new identifyByTransfer(HTTP_NODE_URL);
        const iBySwap = new identifyBySwap(HTTP_NODE_URL, sqlite_database);
        for(let i = 0; i < trxReceipts.length; i++){
            const trxReceipt = trxReceipts[i].result;
            if(trxReceipt == undefined) continue;
            const [transferEvents, swapEvents, tokenSet, poolSet] = await EventDecoder.decode(trxReceipt.logs);
            const [isTransferArb, transferCircles, pivots, maxProfits] = await iByTransfer.identifyArbByTransfer(trxReceipt, transferEvents);
            const [isSwapArb, swapCircles, profits] = await iBySwap.identifyArbBySwap(trxReceipt, swapEvents);
            let trxResult: any = {};
            // basic info
            trxResult["trxIndex"] = parseInt(trxReceipt.transactionIndex, 16);
            trxResult["gasCost"] = parseInt(trxReceipt.gasUsed, 16);
            trxResult["gasPrice"] = parseInt(trxReceipt.effectiveGasPrice, 16);
            const trxfee = BigInt(parseInt(trxReceipt.gasUsed, 16) * parseInt(trxReceipt.effectiveGasPrice, 16));
            trxResult["trxfee"] = trxfee;
            // decode result
            trxResult["transferEvents"] = transferEvents;
            trxResult["swapEvents"] = swapEvents;
            trxResult["tokenSet"] = tokenSet;
            trxResult["poolSet"] = poolSet;
            if((isTransferArb && pivots![0] != '') || isSwapArb){
                // arb trx info
                const addressTokenProfitMap = TrxAnalyzer.analyseAddressTokenNetProfit(transferEvents);
                let profitAllPositive = true;
                const toProfit = addressTokenProfitMap.get(trxReceipt.to);
                if(toProfit != undefined && toProfit.size > 0){
                    for(let [token, value] of toProfit){
                        if(value < 0n) profitAllPositive = false;
                    }
                }
                if(!profitAllPositive){
                    trxResults.push(trxResult);
                    continue;
                }
                trxResult["netProfitMap"] = addressTokenProfitMap;
                let bribeRate = 0n;
                if(toProfit?.has(WETHAddress) && toProfit.get(WETHAddress)! > 0n){
                    trxResult["netProfit"] = toProfit.get(WETHAddress);
                    bribeRate = trxfee / toProfit.get(WETHAddress)!;
                }
                else{
                    trxResult["netProfit"] = -1;
                    bribeRate = -1n;
                }
                trxResult["bribeRate"] = bribeRate;
                let has = false;
                for(let j = trxResults.length - 1; j >= 0; j--){
                    const prePoolSet = trxResults[j]["poolSet"];
                    for(let p of poolSet){
                        if(prePoolSet.includes(p)) has = true;
                    }
                    if(has){
                        trxResult["type"] = "backrun";
                        trxResult["backrunTrxIndex"] = j;
                        break;
                    }
                }
                if(!has) trxResult["type"] = "afterBlock";
                arbTrxResults.push(trxResult);
            }
            trxResults.push(trxResult);
        }
        blockResult["trx"] = trxResults;
        blockResult["arbtrx"] = arbTrxResults;
        trxAnalyzerResult[blockNumber.toString()] = blockResult;
        TrxAnalyzer.writeData(trxAnalyzerResultPath, trxAnalyzerResult);
    }

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

    // static async analyseArb(txReceipt: any): Promise<any[]> {
    //     const transferEvents = EventDecoder.decodeErc20Transfers(txReceipt.logs);
    //     const addressTokenProfitMap = TrxAnalyzer.analyseAddressTokenNetProfit(transferEvents);

    //     let graph = new Map<string, string[]>();
    //     for(let i = 0; i < transferEvents.length - 1; i++){
    //         for(let j = i + 1; j < transferEvents.length; j++){
    //             if(transferEvents[i].address != transferEvents[j].address){
    //                 if(transferEvents[i].from == transferEvents[j].to && addressTokenProfitMap.get(transferEvents[i].from)!.size < 3){
    //                     if(graph.has(transferEvents[j].address)){
    //                         let temp = graph.get(transferEvents[j].address);
    //                         if(!temp?.includes(transferEvents[i].address)) temp?.push(transferEvents[i].address)
    //                         graph.set(transferEvents[j].address, temp?temp:[]);
    //                     }else{
    //                         graph.set(transferEvents[j].address, [transferEvents[i].address]);
    //                     }
    //                     if(!graph.has(transferEvents[i].address)) graph.set(transferEvents[i].address, []);
    //                 }
                    
    //                 if(transferEvents[i].to == transferEvents[j].from && addressTokenProfitMap.get(transferEvents[i].to)!.size < 3){
    //                     if(graph.has(transferEvents[i].address)){
    //                         let temp = graph.get(transferEvents[i].address);
    //                         if(!temp?.includes(transferEvents[j].address)) temp?.push(transferEvents[j].address)
    //                         graph.set(transferEvents[i].address, temp?temp:[]);
    //                     }else{
    //                         graph.set(transferEvents[i].address, [transferEvents[j].address]);
    //                     }
    //                     if(!graph.has(transferEvents[j].address)) graph.set(transferEvents[j].address, []);
    //                 }
    //             }
    //         }
    //     }

    //     const johnson = new AllCyclesInDirectedGraphJohnson();
    //     const circles = johnson.identifyCircle(graph);
    //     let profits = []
    //     if(circles.length > 0){
    //         for(let circle of circles){
    //             let profit = 0n;
    //             for(let [address, tokenNet] of addressTokenProfitMap){
    //                 for(let [token, netValue] of tokenNet){
    //                     if(circle.includes(token))
    //                         profit = netValue > profit ? netValue : profit;
    //                 }
    //             }
    //             profits.push(profit);
    //         }
    //     }
    //     if(profits[0] > 0n) 
    //         return await EventDecoder.decodeTrxSwapEvents(txReceipt.logs);
    //     return [];
    // }
}