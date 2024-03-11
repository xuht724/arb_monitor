import { Log, UnauthorizedProviderError, decodeEventLog } from 'viem';
import { TransferEvent } from './types/events';
import { UNKNOWN } from '../constants/common'
import { EventsSignatureMap, SwapEvent, SwapEventABIMap, PoolType, Protocol } from './constants/events';
import { SqliteHelper } from '../sqliteHelper';
import { protocol } from '../sqliteHelper/types';

export class EventDecoder {
    static async decode(logs: Log[], sqliteHelper: SqliteHelper) {
        const transferEvents = EventDecoder.decodeErc20Transfers(logs);
        const swapEvents = await EventDecoder.decodeTrxSwapEvents(logs, sqliteHelper);
        const orderEvents = await EventDecoder.decodeTrxOrderEvents(logs, sqliteHelper);
        let tokenSet: string[] = [], poolSet: string[] = [];
        for (let event of transferEvents) {
            if (!tokenSet.includes(event.address))
                tokenSet.push(event.address);
        }
        for (let event of swapEvents) {
            if (!tokenSet.includes(event.address))
                poolSet.push(event.address);
        }
        return [transferEvents, swapEvents, orderEvents, tokenSet, poolSet];
    }

    static decodeErc20Transfers(logs: Log[]): TransferEvent[] {
        let events: TransferEvent[] = []
        for (const log of logs) {
            if (log.topics.length > 0) {
                let topic = log.topics[0];
                if (topic == EventsSignatureMap.Erc20_Transfer) {
                    try{
                        const res = decodeEventLog({
                            abi: [
                                {
                                    anonymous: false,
                                    inputs: [
                                        {
                                            indexed: true,
                                            name: 'src',
                                            type: 'address',
                                        },
                                        {
                                            indexed: true,
                                            name: 'dst',
                                            type: 'address',
                                        },
                                        {
                                            indexed: false,
                                            name: 'wad',
                                            type: 'uint256',
                                        },
                                    ],
                                    name: 'Transfer',
                                    type: 'event',
                                } as const
                            ],
                            data: log.data,
                            topics: log.topics,
                            strict: false
                        })
                        events.push({
                            address: log.address,
                            from: res.args.src ? res.args.src.toLowerCase() : UNKNOWN,
                            to: res.args.dst ? res.args.dst.toLowerCase() : UNKNOWN,
                            value: res.args.wad ? res.args.wad : 0n
                        })
                    }
                    catch(error){
                        console.log(error);
                    }
                }
            }
        }
        return events;
    }

    static async decodeTrxSwapEvents(logs: Log[], sqliteHelper: SqliteHelper): Promise<any[]> {
        let events: any[] = [];
        for (const log of logs) {
            if (log.topics.length > 0) {
                let topic = log.topics[0];
                if (topic == EventsSignatureMap.UniV2_Swap) {
                    const res = decodeEventLog({
                        abi: [SwapEventABIMap.UniV2_Swap],
                        data: log.data,
                        topics: log.topics,
                        strict: false
                    })
                    const p = await sqliteHelper.getV2ProtocolByAddress(log.address);
                    events.push({
                        basicInfo: {
                            poolType: PoolType.UNISWAP_V2_LIKE_POOL,
                            protocol: p,
                            address: log.address
                        },
                        from: res.args.sender ? res.args.sender.toLowerCase() : UNKNOWN,
                        to: res.args.to ? res.args.to.toLowerCase() : UNKNOWN,
                        amount0In: res.args.amount0In ? res.args.amount0In : 0n,
                        amount0Out: res.args.amount0Out ? res.args.amount0Out : 0n,
                        amount1In: res.args.amount1In ? res.args.amount1In : 0n,
                        amount1Out: res.args.amount1Out ? res.args.amount1Out : 0n
                    })
                } else if (topic == EventsSignatureMap.UniV3_Swap) {
                    const res = decodeEventLog({
                        abi: [SwapEventABIMap.UniV3_Swap],
                        data: log.data,
                        topics: log.topics,
                        strict: false
                    })
                    const p = await sqliteHelper.getV3ProtocolByAddress(log.address);
                    events.push({
                        basicInfo: {
                            poolType: PoolType.UNISWAP_V3_LIKE_POOL,
                            protocol: p,
                            address: log.address
                        },
                        from: res.args.sender ? res.args.sender.toLowerCase() : UNKNOWN,
                        to: res.args.recipient ? res.args.recipient.toLowerCase() : UNKNOWN,
                        amount0: res.args.amount0 ? res.args.amount0 : 0n,
                        amount1: res.args.amount1 ? res.args.amount1 : 0n,
                        sqrtPriceX96: res.args.sqrtPriceX96 ? res.args.sqrtPriceX96 : 0n,
                        liquidity: res.args.liquidity ? res.args.liquidity : 0n,
                        tick: res.args.tick ? res.args.tick : 0n
                    })
                } else if (topic == EventsSignatureMap.BalancerVault_Swap) {
                    const res = decodeEventLog({
                        abi: [SwapEventABIMap.BalancerVault_Swap],
                        data: log.data,
                        topics: log.topics,
                        strict: false
                    })
                    const p = await sqliteHelper.getBalancerProtocolByAddress(log.address);
                    events.push({
                        basicInfo: {
                            poolType: PoolType.BALANCER_POOL,
                            protocol: p,
                            address: res.args.poolId ? res.args.poolId.slice(0, 20) : UNKNOWN
                        },
                        poolId: res.args.poolId ? res.args.poolId : UNKNOWN,
                        tokenIn: res.args.tokenIn ? res.args.tokenIn : UNKNOWN,
                        tokenOut: res.args.tokenOut ? res.args.tokenOut : UNKNOWN,
                        amountIn: res.args.amountIn ? res.args.amountIn : 0n,
                        amountOut: res.args.amountOut ? res.args.amountOut : 0n
                    })
                } else if (topic == EventsSignatureMap.Curve_TokenExchange) {
                    const res = decodeEventLog({
                        abi: [SwapEventABIMap.Curve_TokenExchange],
                        data: log.data,
                        topics: log.topics,
                        strict: false
                    })
                    events.push({
                        basicInfo: {
                            poolType: PoolType.CURVE_POOL,
                            protocol: Protocol.Curve,
                            address: log.address
                        },
                        buyer: res.args.buyer ? res.args.buyer : UNKNOWN,
                        sold_id: res.args.sold_id ? res.args.sold_id : 0n,
                        tokens_sold: res.args.tokens_sold ? res.args.tokens_sold : 0n,
                        bought_id: res.args.bought_id ? res.args.bought_id : 0n,
                        tokens_bought: res.args.tokens_bought ? res.args.tokens_bought : 0n
                    })
                }
            }
        }
        return events;
    }

    static async decodeTrxOrderEvents(logs: Log[], sqliteHelper: SqliteHelper): Promise<any[]> {
        let events: any[] = [];
        for (const log of logs) {
            if (log.topics.length > 0) {
                let topic = log.topics[0];
                if (topic == EventsSignatureMap.OneInch_OrderFilled){
                    const res = decodeEventLog({
                        abi: [SwapEventABIMap.OneInch_OrderFilled],
                        data: log.data,
                        topics: log.topics,
                        strict: false
                    })
                    events.push({
                        basicInfo: {
                            poolType: PoolType.ORDER,
                            protocol: Protocol.OneInch,
                            address: log.address
                        },
                        maker: res.args.maker ? res.args.maker.toLowerCase() : UNKNOWN,
                        orderHash: res.args.orderHash ? res.args.orderHash : UNKNOWN,
                        remaining: res.args.remaining ? res.args.remaining : 0n
                    })
                } else if (topic == EventsSignatureMap.ZeroX_LimitOrderFilled){
                    const res = decodeEventLog({
                        abi: [SwapEventABIMap.ZeroX_LimitOrderFilled],
                        data: log.data,
                        topics: log.topics,
                        strict: false
                    })
                    events.push({
                        basicInfo: {
                            poolType: PoolType.ORDER,
                            protocol: Protocol.ZeroX,
                            address: log.address
                        },
                        orderHash: res.args.orderHash ? res.args.orderHash : UNKNOWN,
                        maker: res.args.maker ? res.args.maker.toLowerCase() : UNKNOWN,
                        taker: res.args.taker ? res.args.taker.toLowerCase() : UNKNOWN,
                        feeRecipient: res.args.feeRecipient ? res.args.feeRecipient.toLowerCase() : UNKNOWN,
                        makerToken: res.args.makerToken ? res.args.makerToken.toLowerCase() : UNKNOWN,
                        takerToken: res.args.takerToken ? res.args.takerToken.toLowerCase() : UNKNOWN,
                        takerTokenFilledAmount: res.args.takerTokenFilledAmount ? res.args.takerTokenFilledAmount : 0n,
                        makerTokenFilledAmount: res.args.makerTokenFilledAmount ? res.args.makerTokenFilledAmount : 0n,
                        takerTokenFeeFilledAmount: res.args.takerTokenFeeFilledAmount ? res.args.takerTokenFeeFilledAmount : 0n,
                        protocolFeePaid: res.args.protocolFeePaid ? res.args.protocolFeePaid : 0n,
                        pool: res.args.pool ? res.args.pool : UNKNOWN
                    })
                } else if (topic == EventsSignatureMap.UniswapX_Fill){
                    const res = decodeEventLog({
                        abi: [SwapEventABIMap.UniswapX_Fill],
                        data: log.data,
                        topics: log.topics,
                        strict: false
                    })
                    events.push({
                        basicInfo: {
                            poolType: PoolType.ORDER,
                            protocol: Protocol.UniswapX,
                            address: log.address
                        },
                        orderHash: res.args.orderHash ? res.args.orderHash : UNKNOWN,
                        filler: res.args.filler ? res.args.filler.toLowerCase() : UNKNOWN,
                        swapper: res.args.swapper ? res.args.swapper.toLowerCase() : UNKNOWN,
                        nonce: res.args.nonce ? res.args.nonce : 0n
                    })
                }
            }
        }
        return events;
    }
}