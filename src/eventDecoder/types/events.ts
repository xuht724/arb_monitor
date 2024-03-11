import { BitwiseFilter } from "mongodb";
import { SwapEvent, PoolType, Protocol } from "../constants/events"

export type TransferEvent = {
    address: string,
    from: string,
    to: string,
    value: bigint
}

export type SwapEvents = UniV2SwapEvent | UniV3SwapEvent | BalancerVaultSwapEvent | CurveTokenExchangeEvent;
export type OrderEvents = OneInchOrderFilledEvent | ZeroXLimitOrderFilledEvent | UniswapXFillEvent;


export type basicEventInfo = {
    poolType: PoolType,
    protocol: Protocol,
    address: string
}                        

export type UniV2SwapEvent = {
    basicInfo: basicEventInfo,
    from: string,
    to: string,
    amount0In: bigint,
    amount0Out: bigint,
    amount1In: bigint,
    amount1Out: bigint
}

export type UniV3SwapEvent = {
    basicInfo: basicEventInfo,
    from: string,
    to: string,
    amount0: bigint,
    amount1: bigint,
    sqrtPriceX96: bigint,
    liquidity: bigint,
    tick: number
}

export type BalancerVaultSwapEvent = {
    basicInfo: basicEventInfo,
    poolId: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    amountOut: bigint
}

export type CurveTokenExchangeEvent = {
    basicInfo: basicEventInfo,
    buyer: string,
    sold_id: number,
    tokens_sold: bigint,
    bought_id: number,
    tokens_bought: bigint
}

export type OneInchOrderFilledEvent = {
    basicInfo: basicEventInfo,
    maker: string,
    orderHash: string,
    remaining: bigint
}

export type ZeroXLimitOrderFilledEvent = {
    basicInfo: basicEventInfo,
    orderHash: string,
    maker: string,
    taker: string,
    feeRecipient: string,
    makerToken: string,
    takerToken: string,
    takerTokenFilledAmount: bigint,
    makerTokenFilledAmount: bigint,
    takerTokenFeeFilledAmount: bigint,
    protocolFeePaid: bigint,
    pool: string
}

export type UniswapXFillEvent = {
    basicInfo: basicEventInfo,
    orderHash: string,
    filler: string,
    swapper: string,
    nonce: bigint
}