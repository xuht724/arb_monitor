import { PublicClient, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { HTTP_NODE_URL } from "../config";
import { BlockMetadata, TrxMetadata } from "../eventDecoder/types/block";


export class ChainStateHelper {
    publicClient: PublicClient;
    nodeUrl: string

    constructor(nodeUrl: string) {
        this.nodeUrl = nodeUrl;
        this.publicClient = createPublicClient({
            chain: mainnet,
            transport: http(nodeUrl)
        })
    }

    async downloadBlockMetadata(blockNumber: number | bigint) {
        try {
            let block = await this.downloadBlock(blockNumber, true);
            let trxHashs: string[] = [];
            let trxs: any[] = [];
            // console.log(block);

            block.transactions.forEach((tx) => {
                let txn = tx as any
                let trxMetadata: TrxMetadata = {
                    from: txn.hash,
                    to: txn.to,
                    nonce: txn.nonce,
                    blockNumber: txn.blockNumber,
                    maxPriorityFeePerGas: txn.maxPriorityFeePerGas,
                    maxFeePerGas: txn.maxFeePerGas,
                    input: txn.string,
                    transactionIndex: txn.transactionIndex,
                    gas: txn.gas,
                    hash: txn.hash
                }
                trxs.push(trxMetadata);
                trxHashs.push(txn.hash);
            });
            let downloadReceipts = await this.downloadReceipts(trxHashs, blockNumber);

            // for (const receipt of downloadReceipts) {
            //     console.log(receipt.result);
            // }
            let receipts = downloadReceipts.map((res: any) => {
                let receiptRes = res.result;
                if(receiptRes == undefined) return undefined;
                return {
                    transactionHash: receiptRes.transactionHash,
                    blockHash: receiptRes.blockHash,
                    blockNumber: BigInt(receiptRes.blockNumber),
                    logs: receiptRes.logs, // 你可能需要根据实际情况填充 logs 数组
                    contractAddress: receiptRes.contractAddress,
                    effectiveGasPrice: BigInt(receiptRes.effectiveGasPrice),
                    from: receiptRes.from,
                    gasUsed: BigInt(receiptRes.gasUsed),
                    logsBloom: receiptRes.logsBloom,
                    status: receiptRes.status,
                    to: receiptRes.to,
                    transactionIndex: receiptRes.transactionIndex,
                    type: receiptRes.type
                }
            })

            let myBlock: BlockMetadata = {
                number: block.number,
                blockHash: block.hash,
                extraData: block.extraData,
                gasLimit: block.gasLimit,
                gasUsed: block.gasUsed,
                logsBloom: block.logsBloom,
                miner: block.miner,
                timestamp: block.timestamp,
                baseFeePerGas: block.baseFeePerGas,
                transactions: trxs,
                receipts: receipts
            }
            return myBlock;
        } catch (error) {
            console.log(error)
        }
    }

    async downloadBlock(blockNumber: number | bigint, inculudingFullTrx: boolean) {
        try {
            let block = await this.publicClient.getBlock({
                blockNumber: BigInt(blockNumber),
                includeTransactions: inculudingFullTrx
            })
            return block
        } catch (error) {
            throw new Error(`Fail to get block, blockNumber ${blockNumber}`);
        }
    }


    async downloadReceipts(trxHashs: string[], blockNumber?: bigint | number) {
        try {
            let reqs: any[] = [];
            for (let i = 0; i < trxHashs.length; i++) {
                reqs.push({
                    method: 'eth_getTransactionReceipt',
                    params: [trxHashs[i]],
                    id: i,
                    jsonrpc: '2.0'
                })
            }
            const res = await fetch(HTTP_NODE_URL, {
                method: 'POST',
                body: JSON.stringify(reqs),
                headers: { 'Content-Type': 'application/json' }
            })
            let receipts = res.json();
            return receipts
        } catch (error) {
            throw new Error(`Fail to trx receipts, blockNumber: ${blockNumber}`)
        }
    }
}