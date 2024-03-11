import winston, { createLogger, transports } from "winston";
import mongodb, { MongoClient } from 'mongodb';
import { mongodb_url } from "../config";
import { BlockMetadata } from "../eventDecoder/types/block";
import { arbAnalyseResult, arbTrx } from "../eventDecoder/types/arb";
import { defineBlock } from "viem";

export class MongoDBHelper {
    client: MongoClient;
    db!: mongodb.Db;
    logger: winston.Logger;

    constructor() {
        this.client = new MongoClient(mongodb_url, { monitorCommands: true});
        this.logger = createLogger({
            transports: [new transports.File({ filename: "./log/mongodb.log" })]
        });
    }

    public async connect(){
        await this.client.connect();
        this.db = this.client.db('Block');
    }

    public close(){
        this.client.close();
    }

    public async deleteDuplicateBlockMetadata(index: string){
        const data = await this.db.collection('BlockMetadata').aggregate([
            { $group: { _id: "$" + index, count: {$sum: 1 } } },
            { $match: { count: {$gt: 1 } } }
        ]).toArray();
        for(let d of data){
            this.db.collection('BlockMetadata').deleteOne({number: d._id});
        }
    }

    public async getArbBlockNumber(start: bigint, end: bigint){
        const data = await this.db.collection('ArbTrx').distinct("blockNumber");
        let num = 0;
        for(let d of data){
            if(BigInt(d) < end && BigInt(d) > start) num++
        }
        console.log(num);
    }

    public async loadBlockMetadata(beginBlockNumber: bigint = 0n, endBlockNumber: bigint = BigInt(Number.MAX_VALUE)) {
        const data = await this.db.collection('BlockMetadata').find({
            "number" : {$gte:Number(beginBlockNumber), $lte:Number(endBlockNumber)}
        }).toArray();
        const castedData: BlockMetadata[] = data.map((document: any) => ({
            number: document.number,
            blockHash: document.blockHash,
            extraData: document.extraData,
            gasLimit: document.gasLimit,
            gasUsed: document.gasUsed,
            logsBloom: document.logsBloom,
            miner: document.miner,
            timestamp: document.timestamp,
            baseFeePerGas: document.baseFeePerGas,
            transactions: document.transactions,
            receipts: document.receipts
        }));
        return castedData;
    }

    public async loadArbTrx(beginBlockNumber: bigint = 0n, endBlockNumber: bigint = BigInt(Number.MAX_VALUE)) {
        const data = await this.db.collection('ArbTrx').find({
            "blockNumber" : {$gte:Number(beginBlockNumber), $lte:Number(endBlockNumber)}
        }).toArray();
        const castedData: arbTrx[] = data.map((document: any) => ({
            trxHash: document.trxHash,
            blockNumber: document.blockNumber,
            trxIndex: document.trxIndex,
            gasCost: document.gasCost,
            gasPrice: document.gasPrice,
            trxfee: document.trxfee,
            transferEvents: document.transferEvents,
            swapEvents: document.swapEvents,
            orderEvents: [],
            tokenSet: document.tokenSet,
            poolSet: document.poolSet,
            netProfitMap: document.netProfitMap,
            netWETHProfit: document.netWETHProfit,
            bribeRate: document.bribeRate,
            type: document.type,
            backrunTrx: document.backrunTrx != undefined ? document.backrunTrx : null,
            trxReceipt: document.trxReceipt,
            DetectArbResByTransfer: document.DetectArbResByTransfer
        }));
        return castedData;
    }

    public async writeBlockMetadata(data: BlockMetadata[]){
        try{
            await this.db.collection('BlockMetadata').insertMany(data);
        }
        catch (error) {
            console.log(error);
            this.logger.info(error);
        }
    }

    public async writeArbAnalyseResult(data: arbTrx[]){
        try{
            await this.db.collection('ArbTrx').insertMany(data);
        }
        catch (error) {
            console.log(error);
            this.logger.info(error);
        }
    }
}