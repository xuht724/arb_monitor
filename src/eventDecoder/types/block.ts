import { Log } from "viem"

export type BlockMetadata = {
    number: bigint,
    blockHash: string,
    extraData: string,
    gasLimit: bigint,
    gasUsed: bigint,
    logsBloom: string,
    miner: string,
    timestamp: bigint,
    baseFeePerGas: bigint | null,
    transactions: TrxMetadata[],
    receipts: ReceiptMetadata[]
}

export type TrxMetadata = {
    from: string,
    to: string,
    nonce: number,
    blockNumber: bigint,
    maxPriorityFeePerGas: bigint,
    maxFeePerGas: bigint,
    input: string,
    transactionIndex: number,
    gas: bigint
    hash: string
}

export type ReceiptMetadata = {
    transactionHash: string;
    blockHash: string;
    blockNumber: bigint;
    logs: Log[];
    contractAddress: string | null;
    effectiveGasPrice: bigint;
    from: string;
    gasUsed: bigint;
    logsBloom: string;
    status: string;
    to: string;
    transactionIndex: string;
    type: string;
}

export type LogEntry = {
    transactionHash: string;
    address: string;
    blockHash: string;
    blockNumber: string;
    data: string;
    logIndex: string;
    removed: boolean;
    topics: string[];
    transactionIndex: string;
}