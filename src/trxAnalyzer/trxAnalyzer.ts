import * as fs from 'node:fs';
import * as path from 'node:path';
import { TransferEvent } from "../eventDecoder/types/events";
import { EventDecoder } from "../eventDecoder/eventDecoder";
import { HTTP_NODE_URL } from '../config';
import { WETHAddress } from "../constants/token";
import { AllCyclesInDirectedGraphJohnson } from '../arbIdentification/loopHelper/AllCyclesInDirectedGraphJohnson'
import { IdentifyByTransfer } from "../arbIdentification/identifyByTransfer";
import { identifyBySwap } from "../arbIdentification/identifyBySwap";
import { replacer } from '../utils/utils';
import { arbAnalyseResult, arbTrx, arbType, normalTrx } from '../eventDecoder/types/arb';
import { SqliteHelper } from '../sqliteHelper';


export class TrxAnalyzer {

    // static loadData(infoPath: string) {
    //     const absPath = path.resolve(infoPath);
    //     if (fs.existsSync(absPath)) {
    //         return JSON.parse(fs.readFileSync(absPath, "utf8"));
    //     }
    //     else {
    //         let temp = JSON.stringify({});
    //         fs.writeFile(absPath, temp, (err) => {
    //             if (err) {
    //                 console.log('Error creating json:', err);
    //             }
    //         });
    //         return {};
    //     }
    // }

    // static writeData(infoPath: string, info: any) {
    //     const absPath = path.resolve(infoPath);
    //     const jsoninfo = JSON.stringify(info, replacer);
    //     fs.writeFileSync(absPath, jsoninfo);
    // }

    // static async batchGetBlock(startBlock: bigint, endBlock: bigint) {
    //     let blockReqs = [];
    //     for (let i = startBlock; i < endBlock; i++) {
    //         blockReqs.push({
    //             method: 'eth_getBlockByNumber',
    //             params: [`0x${i.toString(16)}`, false],
    //             id: 0,
    //             jsonrpc: '2.0'
    //         });
    //     }
    //     const blockRes = await fetch(HTTP_NODE_URL, {
    //         method: 'POST',
    //         body: JSON.stringify(blockReqs),
    //         headers: { 'Content-Type': 'application/json' }
    //     });
    //     const blocks = await blockRes.json();
    //     return blocks;
    // }

    // static async batchGetTrxReceipt(blocks: any) {
    //     let promiseList = [];
    //     for (let i = 0; i < blocks.length; i++) {
    //         const block = blocks[i].result;
    //         let trxReqs = [];
    //         for (let i = 0; i < block.transactions.length; i++) {
    //             trxReqs.push({
    //                 method: 'eth_getTransactionReceipt',
    //                 params: [block.transactions[i]],
    //                 id: i,
    //                 jsonrpc: '2.0'
    //             });
    //         }
    //         promiseList.push(fetch(HTTP_NODE_URL, {
    //             method: 'POST',
    //             body: JSON.stringify(trxReqs),
    //             headers: { 'Content-Type': 'application/json' }
    //         }));
    //         //const trxReceipts = await trxRes.json();
    //     }
    //     const res = Promise.all(promiseList);
    //     return res;
    // }

    static async analyse(blockNumber: bigint, trxReceipts: any, sqliteHelper: SqliteHelper) {
        const node_fetch = await import('node-fetch');

        let trxResults: (normalTrx | arbTrx)[] = [];
        let arbTrxResults: arbTrx[] = [];

        const iBySwap = new identifyBySwap(HTTP_NODE_URL, sqliteHelper);
        for (let i = 0; i < trxReceipts.length; i++) {
            const trxReceipt = trxReceipts[i];
            if (trxReceipt == undefined) continue;
            const [transferEvents, swapEvents, orderEvents, tokenSet, poolSet] = await EventDecoder.decode(trxReceipt.logs, sqliteHelper);
            const DetectArbResByTransfer = IdentifyByTransfer.identifyArbByTransfer(trxReceipt, transferEvents);
            const [isSwapArb, swapCircles, profits] = await iBySwap.identifyArbBySwap(trxReceipt, swapEvents);
            
            const trxfee = BigInt(trxReceipt.gasUsed) * BigInt(trxReceipt.effectiveGasPrice);
            if ((DetectArbResByTransfer.isArb && (DetectArbResByTransfer.info![0]).pivot != '') || isSwapArb) {
                // arb trx info
                const addressTokenProfitMap = TrxAnalyzer.analyseAddressTokenNetProfit(transferEvents);
                let profitAllPositive = true;
                const toProfit = addressTokenProfitMap.get(trxReceipt.to);
                if (toProfit != undefined && toProfit.size > 0) {
                    for (let [token, value] of toProfit) {
                        if (value < 0n) profitAllPositive = false;
                    }
                }
                if (!profitAllPositive) {
                    const trxResult: normalTrx = {
                        trxHash: trxReceipt.transactionHash,
                        blockNumber: blockNumber,
                        trxIndex: parseInt(trxReceipt.transactionIndex, 16),
                        gasCost: BigInt(trxReceipt.gasUsed),
                        gasPrice: BigInt(trxReceipt.effectiveGasPrice),
                        trxfee: trxfee,
                        transferEvents: transferEvents,
                        swapEvents: swapEvents,
                        orderEvents: orderEvents,
                        tokenSet: tokenSet,
                        poolSet: poolSet
                    }
                    trxResults.push(trxResult);
                    continue;
                }
                let trxResult: arbTrx = {
                    trxHash: trxReceipt.transactionHash,
                    blockNumber: blockNumber,
                    trxIndex: parseInt(trxReceipt.transactionIndex, 16),
                    gasCost: BigInt(trxReceipt.gasUsed),
                    gasPrice: BigInt(trxReceipt.effectiveGasPrice),
                    trxfee: trxfee,
                    transferEvents: transferEvents,
                    swapEvents: swapEvents,
                    orderEvents: orderEvents,
                    tokenSet: tokenSet,
                    poolSet: poolSet,
                    netProfitMap: addressTokenProfitMap,
                    netWETHProfit: -1n,
                    bribeRate: -1,
                    type: arbType.UNKNOWN,
                    trxReceipt: trxReceipt,
                    DetectArbResByTransfer: DetectArbResByTransfer
                }
                if (toProfit?.has(WETHAddress) && toProfit.get(WETHAddress)! > 0n) {
                    trxResult.netWETHProfit = toProfit.get(WETHAddress)!;
                    trxResult.bribeRate = (Number(trxReceipt.gasUsed) * Number(trxReceipt.effectiveGasPrice)) / Number(toProfit.get(WETHAddress)!);
                }
                let has = false;
                for (let j = trxResults.length - 1; j >= 0; j--) {
                    const prePoolSet = trxResults[j].poolSet;
                    for (let p of poolSet) {
                        if (prePoolSet.includes(p)) has = true;
                    }
                    if (has) {
                        trxResult.type = arbType.BACKRUN;
                        trxResult.backrunTrx = trxResults[j];
                        break;
                    }
                }
                if (!has) trxResult.type = arbType.AFTERBLOCK;
                arbTrxResults.push(trxResult);
                trxResults.push(trxResult);
                continue;
            }
            const trxResult: normalTrx = {
                trxHash: trxReceipt.transactionHash,
                blockNumber: blockNumber,
                trxIndex: parseInt(trxReceipt.transactionIndex, 16),
                gasCost: BigInt(trxReceipt.gasUsed),
                gasPrice: BigInt(trxReceipt.effectiveGasPrice),
                trxfee: trxfee,
                transferEvents: transferEvents,
                swapEvents: swapEvents,
                orderEvents: orderEvents,
                tokenSet: tokenSet,
                poolSet: poolSet
            }
            trxResults.push(trxResult);
        }
        return arbTrxResults;
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