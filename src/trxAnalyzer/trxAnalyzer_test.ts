import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    http,
    createPublicClient,
    numberToBytes,
} from 'viem';
import { mainnet } from "viem/chains";
import { TrxAnalyzer } from './trxAnalyzer';
import { HTTP_NODE_URL, failedBlockNumberPath, sqlite_database } from '../config';
import { ChainStateHelper } from '../chainStateHelper.ts/chainStateHelper';
import { MongoDBHelper } from '../mongoDBHelper/mongoDBHelper';
import { BlockMetadata } from '../eventDecoder/types/block';
import { arbTrx } from '../eventDecoder/types/arb';
import { SqliteHelper } from '../sqliteHelper';
import { Long, MongoGridFSChunkError } from 'mongodb';
import { EventDecoder } from '../eventDecoder/eventDecoder';
import { PoolType } from '../eventDecoder/constants/events';
import { replacer } from '../utils/utils';
import { COWProtocol } from '../constants/token';

async function main() {
    // 1.1 12:00:00AM 18908895n
    // 3.1 12:00:00AM 19336606n
    await downloadBlockMetadataForFirstTime(19236606n, 19256606n);
    //await downloadFailedBlockMetadataByTxt();
    //await downloadFailedBlockMetadataByDB(19306606n, 19316606n);
    //await analyseBlock(19326606n, 19336606n)
    //await detectOrder(19326606n, 19336606n);
    //getBribeRateDistribution("src/trxAnalyzerResult.json", 19317659n, 19318659n);
}

async function detectOrder(start: bigint, end: bigint) {
    const mongodbhelper = new MongoDBHelper();
    await mongodbhelper.connect();
    const sqliteHelper = new SqliteHelper(sqlite_database);
    const trxs = await mongodbhelper.loadArbTrx(start, end);
    
    let totalNum = 0;
    let orderNum = 0;
    let orderTrx: any = {};
    let normalTrx:any = {};
    let abnormalTrx: string[] = [];
    for(let trx of trxs){
        if(trx.swapEvents.length == 0){
            abnormalTrx.push(trx.trxHash);
            continue;
        }
        let notArb = false;
        for(let e of trx.transferEvents){
            console.log(BigInt(e.value));
            if(e.to == COWProtocol) notArb = true;
        }
        if(notArb) continue;
        totalNum++;
        const swapEvents = await EventDecoder.decodeTrxSwapEvents(trx.trxReceipt.logs, sqliteHelper);
        const orderEvents = await EventDecoder.decodeTrxOrderEvents(trx.trxReceipt.logs, sqliteHelper);
        trx.swapEvents = swapEvents;
        trx.orderEvents = orderEvents;
        normalTrx[trx.trxHash] = trx;
        if(orderEvents.length > 0){
            orderTrx[trx.trxHash] = trx;
            orderNum++;
        }
    }
    console.log("number of trxs between ", start, " and ", end, " : ", totalNum);
    console.log("number of trxs that contain order event: ", orderNum);
    let absPath = path.resolve("src/orderTrx.json");
    let jsoninfo = JSON.stringify(orderTrx, replacer);
    fs.writeFileSync(absPath, jsoninfo);
    absPath = path.resolve("src/arbTrx.json");
    jsoninfo = JSON.stringify(normalTrx, replacer);
    fs.writeFileSync(absPath, jsoninfo);
    absPath = path.resolve("src/abnormalTrx.txt");
    fs.writeFileSync(absPath, abnormalTrx.toString());
}

async function analyseBlock(start: bigint, end: bigint) {
    const mongodbhelper = new MongoDBHelper();
    await mongodbhelper.connect();
    const sqliteHelper = new SqliteHelper(sqlite_database);
    const batchSize = 10n;

    for(let i = start; i < end; i += batchSize){
        let endBlock = i + batchSize;
        if(i + batchSize > end)
            endBlock = end;
        let res: arbTrx[] = [];
        const data = await mongodbhelper.loadBlockMetadata(i, endBlock - 1n);
        for(let j = 0; j < data.length; j++){
            const block = data[j];
            const result = await TrxAnalyzer.analyse(BigInt(block.number), block.receipts, sqliteHelper);
            res = [...res, ...result];
        }
        if(res.length > 0)
            await mongodbhelper.writeArbAnalyseResult(res);
        console.log("analyse blocks from ", i, " to ", endBlock);
    }
}

async function downloadFailedBlockMetadataByDB(start: bigint, end: bigint){
    const chainStateHelper = new ChainStateHelper(HTTP_NODE_URL);
    const mongodbhelper = new MongoDBHelper();
    await mongodbhelper.connect();
    const batchSize = 100n;

    let failedBlockNumber = [];
    let blocks: BlockMetadata[] = [];
    let nums: bigint[] = [];
    for(let i = start; i < end; i += batchSize){
        let endBlock = i + batchSize;
        if(i + batchSize > end)
            endBlock = end;
        do{
            blocks = [];
            failedBlockNumber = [];
            nums = [];
            const data = await mongodbhelper.loadBlockMetadata(i, endBlock - 1n);
            for(let d of data) nums.push(BigInt(d.number));
            if(nums.length == Number(batchSize)) break;
            for(let j = i; j < endBlock; j++){
                if(nums.includes(j) == false){
                    const block = await chainStateHelper.downloadBlockMetadata(j);
                    if(block != undefined)
                        blocks.push(block);
                    else failedBlockNumber.push(j);
                }
                if(blocks.length > 10){
                    await mongodbhelper.writeBlockMetadata(blocks);
                    blocks = [];
                }
            }
            if(blocks.length > 0) await mongodbhelper.writeBlockMetadata(blocks);
        }while(failedBlockNumber.length > 0);
        console.log("fetched blocks from ", i, " to ", endBlock);
    }
}

async function downloadFailedBlockMetadataByTxt(){
    const absPath = path.resolve(failedBlockNumberPath);
    let blockNumbers = [];
    if (fs.existsSync(absPath)) {
        blockNumbers = fs.readFileSync(absPath, "utf8").split(",").map(num => BigInt(num));
    }
    else return;

    const chainStateHelper = new ChainStateHelper(HTTP_NODE_URL);
    const mongodbhelper = new MongoDBHelper();
    await mongodbhelper.connect();

    let failedBlockNumber = []
    let blocks: BlockMetadata[] = [];
    for(let blockNumber of blockNumbers){
        const block = await chainStateHelper.downloadBlockMetadata(blockNumber);
        if(block != undefined)
            blocks.push(block);
        else failedBlockNumber.push(blockNumber);
        if(blocks.length > 10){
            await mongodbhelper.writeBlockMetadata(blocks);
            blocks = [];
        }
    }
    if(blocks.length > 0)
        await mongodbhelper.writeBlockMetadata(blocks);
    if(failedBlockNumber.length > 0){
        const absPath = path.resolve(failedBlockNumberPath);
        fs.writeFileSync(absPath, failedBlockNumber.toString());
    }
}

async function downloadBlockMetadataForFirstTime(start: bigint, end: bigint) {
    const chainStateHelper = new ChainStateHelper(HTTP_NODE_URL);
    const mongodbhelper = new MongoDBHelper();
    await mongodbhelper.connect();
    const batchSize = 10n;
    let failedBlockNumber = [];

    for(let i = start; i < end; i += batchSize){
        let endBlock = i + batchSize;
        if(i + batchSize > end)
            endBlock = end;
        let blocks: BlockMetadata[] = [];
        for(let j = i; j < endBlock; j++){
            const block = await chainStateHelper.downloadBlockMetadata(j);
            if(block != undefined)
                blocks.push(block);
            else failedBlockNumber.push(j);
        }
        if(blocks.length > 0)
            await mongodbhelper.writeBlockMetadata(blocks);
        console.log("fetched blocks from ", i, " to ", endBlock);
    }
    console.log("finish fetching blocks' metadata from ", start, " to ", end);
    if(failedBlockNumber.length > 0){
        const absPath = path.resolve(failedBlockNumberPath);
        fs.appendFileSync(absPath, failedBlockNumber.toString());
    }
    
}

// function getBribeRateDistribution(path: string, startBlock: bigint, endBlock: bigint) {
//     const data = TrxAnalyzer.loadData(path);
//     let bribeRateDistribution = Array(13).fill(0);
//     let bribeRate = [];
//     for (let i = startBlock; i < endBlock; i += 1n) {
//         const blockResult = data[i.toString()];
//         if (blockResult == undefined) continue;
//         if (blockResult["arbtrx"].length > 0) {
//             for (let arbtrx of blockResult["arbtrx"]) {
//                 if (0 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.1)
//                     bribeRateDistribution[1]++;
//                 else if (0.1 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.2)
//                     bribeRateDistribution[2]++;
//                 else if (0.2 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.3)
//                     bribeRateDistribution[3]++;
//                 else if (0.3 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.4)
//                     bribeRateDistribution[4]++;
//                 else if (0.4 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.5)
//                     bribeRateDistribution[5]++;
//                 else if (0.5 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.6)
//                     bribeRateDistribution[6]++;
//                 else if (0.6 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.7)
//                     bribeRateDistribution[7]++;
//                 else if (0.7 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.8)
//                     bribeRateDistribution[8]++;
//                 else if (0.8 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.9)
//                     bribeRateDistribution[9]++;
//                 else if (0.9 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 0.95)
//                     bribeRateDistribution[10]++;
//                 else if (0.95 < arbtrx["bribeRate"] && arbtrx["bribeRate"] <= 1)
//                     bribeRateDistribution[11]++;
//                 else if (arbtrx["bribeRate"] > 1)
//                     bribeRateDistribution[12]++;
//                 else bribeRateDistribution[0]++;
//                 if (arbtrx["bribeRate"] > 0) bribeRate.push(arbtrx["bribeRate"]);
//             }
//         }
//     }
//     console.log("Bribe Rate Distribution: ");
//     console.log("0 < bribeRate <= 0.1: ", bribeRateDistribution[1]);
//     console.log("0.1 < bribeRate <= 0.2: ", bribeRateDistribution[2]);
//     console.log("0.2 < bribeRate <= 0.3: ", bribeRateDistribution[3]);
//     console.log("0.3 < bribeRate <= 0.4: ", bribeRateDistribution[4]);
//     console.log("0.4 < bribeRate <= 0.5: ", bribeRateDistribution[5]);
//     console.log("0.5 < bribeRate <= 0.6: ", bribeRateDistribution[6]);
//     console.log("0.6 < bribeRate <= 0.7: ", bribeRateDistribution[7]);
//     console.log("0.7 < bribeRate <= 0.8: ", bribeRateDistribution[8]);
//     console.log("0.8 < bribeRate <= 0.9: ", bribeRateDistribution[9]);
//     console.log("0.9 < bribeRate <= 0.95: ", bribeRateDistribution[10]);
//     console.log("0.95 < bribeRate <= 1: ", bribeRateDistribution[11]);
//     console.log("1 < bribeRate: ", bribeRateDistribution[12]);
//     console.log("Unknown: ", bribeRateDistribution[0]);
// }

main();