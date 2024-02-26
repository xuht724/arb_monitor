import { ProtocolName, PoolType } from "./enum";
import { Token } from "./token";

// This can be used to initialize a pool
export type PoolStatistic = {};

export type PoolInitialInfo = {
    protocolName: ProtocolName;
    poolAddress: string;
    poolType: PoolType;

    tvl?: bigint;
    blocktimestampLast?: bigint;
};

export type V2PoolDocument = {
    token0: Token;
    token1: Token;
    blockTimestampLast?: number;
} & PoolInitialInfo;

export type V3PoolDocument = {
    token0: Token;
    token1: Token;
    fee: number;
    tickSpacing: number;
} & PoolInitialInfo;

export type BalancerWeightedPoolDocument = {
    poolId: string;
    tokens: Token[];
    weights: bigint[];
    swapFee: bigint;
} & PoolInitialInfo;

export type CurveCryptoSwapPoolDocument = {
    coins: Token[];
    A: bigint;
    balances: bigint[];
    rates: bigint[];
    midFee: bigint;
    outFee: bigint;
    feeGamma: bigint;
    adminFee: bigint;
    price_scale: bigint[];
} & PoolInitialInfo;

export type CurveStableSwapPoolDocument = {
    coins: Token[];
    A: bigint;
    rates: bigint[];
    swapFee: bigint;
    swapFeeMultiplier: bigint | null;
    adminFee: bigint;
} & PoolInitialInfo;
