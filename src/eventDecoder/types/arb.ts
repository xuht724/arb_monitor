import { DetectArbResByTransfer } from "../../arbIdentification/identifyByTransfer"
import { ReceiptMetadata } from "./block"
import { OrderEvents, SwapEvents, TransferEvent } from "./events"

export type arbAnalyseResult = {
    number: bigint,
    arbtrx: arbTrx[]
}

export type normalTrx = {
    trxHash: string,
    blockNumber: bigint,
    trxIndex: number,
    gasCost: bigint,
    gasPrice: bigint,
    trxfee: bigint,
    transferEvents: TransferEvent[],
    swapEvents: SwapEvents[],
    orderEvents: OrderEvents[],
    tokenSet: string[],
    poolSet: string[]
}

export type arbTrx = {
    trxHash: string,
    blockNumber: bigint,
    trxIndex: number,
    gasCost: bigint,
    gasPrice: bigint,
    trxfee: bigint,
    transferEvents: TransferEvent[],
    swapEvents: SwapEvents[],
    orderEvents: OrderEvents[],
    tokenSet: string[],
    poolSet: string[],
    netProfitMap: Map<string, Map<string, bigint>>,
    netWETHProfit: bigint,
    bribeRate: number,
    type: arbType,
    backrunTrx?: normalTrx,
    trxReceipt: ReceiptMetadata,
    DetectArbResByTransfer: DetectArbResByTransfer
}

export enum arbType {
    BACKRUN = "backrun",
    AFTERBLOCK = "afterBlock",
    UNKNOWN = "unknown"
}