import { PoolType, ProtocolName } from "./enum";
import { Token } from "./token";

//
export interface v2Edge {
    protocolName: ProtocolName;
    pairAddress: string;
    token0: string;
    token1: string;
    index?: number;
    blockTimestampLast?: number;
}

export interface v3Edge {
    protocolName: ProtocolName;
    pairAddress: string;
    token0: string;
    token1: string;
    fee: number;
    tickSpacing: number;
    blockTimestampLast?: number;
}

export interface Basic2AssetEdge {
    protocolName: ProtocolName;
    pairAddress: string;
    token0: string;
    token1: string;
}

export type balancerWeightedPool = {
    protocolName: ProtocolName;
    poolAddress: string;
    poolId: string;
    tokens: string[];
    weights: bigint[];
    swapFee: bigint;
};
