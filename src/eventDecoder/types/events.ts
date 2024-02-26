import { SwapEvent, PoolType, Protocol } from "../constants/events"

export type TransferEvent = {
    address: string,
    from: string,
    to: string,
    value: bigint
}

export type UniV2SwapEvent = {
    poolType: PoolType,
    protocol: Protocol,
    address: string,
    from: string,
    to: string,
    amount0In: bigint,
    amount0Out: bigint,
    amount1In: bigint,
    amount1Out: bigint
}

export type UniV3SwapEvent = {
    poolType: PoolType,
    protocol: Protocol,
    address: string,
    from: string,
    to: string,
    amount0: bigint,
    amount1: bigint,
    sqrtPriceX96: bigint,
    liquidity: bigint,
    tick: number
}

export type BalancerVaultSwapEvent = {
    poolType: PoolType,
    protocol: Protocol,
    address: string,
    poolId: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    amountOut: bigint
}

export type CurveTokenExchangeEvent = {
    poolType: PoolType,
    protocol: Protocol,
    address: string,
    buyer: string,
    sold_id: number,
    tokens_sold: bigint,
    bought_id: number,
    tokens_bought: bigint
}