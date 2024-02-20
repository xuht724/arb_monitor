import { Log, decodeEventLog } from 'viem';
import { TransferEvent } from './types/events';
import { UNKNOWN } from '../constants/common'
import { EventsSignatureMap, SwapEvent, SwapEventABIMap } from './constants/events';
export class EventDecoder {
    static decodeErc20Transfers(logs: Log[]): TransferEvent[] {
        let events: TransferEvent[] = []
        for (const log of logs) {
            if (log.topics.length > 0) {
                let topic = log.topics[0];
                if (topic == EventsSignatureMap.Erc20_Transfer) {
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
                        from: res.args.src ? res.args.src : UNKNOWN,
                        to: res.args.dst ? res.args.dst : UNKNOWN,
                        value: res.args.wad ? res.args.wad : 0n
                    })
                }
            }


        }
        return events;
    }


    static decodeTrxSwapEvents(logs: Log[]): any[] {
        let events: any[] = [];
        for (const log of logs) {
            if(log.topics.length > 0){
                let topic = log.topics[0];
                if(topic == EventsSignatureMap.UniV2_Swap){
                    const res = decodeEventLog({
                        abi: [SwapEventABIMap.UniV2_Swap],
                        data: log.data,
                        topics: log.topics,
                        strict: false
                    })
                    events.push({
                        protocol: SwapEvent.UNIV2_Swap,
                        address: log.address,
                        from: res.args.sender ? res.args.sender : UNKNOWN,
                        to: res.args.to ? res.args.to : UNKNOWN,
                        amount0In: res.args.amount0In ? res.args.amount0In : 0n,
                        amount0Out: res.args.amount0Out ? res.args.amount0Out : 0n,
                        amount1In: res.args.amount1In ? res.args.amount1In : 0n,
                        amount1Out: res.args.amount1Out ? res.args.amount1Out : 0n
                    })
                }else if(topic == EventsSignatureMap.UniV3_Swap){
                    const res = decodeEventLog({
                        abi: [SwapEventABIMap.UniV3_Swap],
                        data: log.data,
                        topics: log.topics,
                        strict: false
                    })
                    events.push({
                        protocol: SwapEvent.UNIV3_Swap,
                        address: log.address,
                        from: res.args.sender ? res.args.sender : UNKNOWN,
                        to: res.args.recipient ? res.args.recipient : UNKNOWN,
                        amount0: res.args.amount0 ? res.args.amount0 : 0n,
                        amount1: res.args.amount1 ? res.args.amount1 : 0n,
                        sqrtPriceX96: res.args.sqrtPriceX96 ? res.args.sqrtPriceX96 : 0n,
                        liquidity: res.args.liquidity ? res.args.liquidity : 0n,
                        tick: res.args.tick ? res.args.tick : 0n
                    })
                }else if(topic == EventsSignatureMap.BalancerVault_Swap){
                    const res = decodeEventLog({
                        abi: [SwapEventABIMap.BalancerVault_Swap],
                        data: log.data,
                        topics: log.topics,
                        strict: false
                    })
                    events.push({
                        protocol: SwapEvent.BALANCERVAULT_Swap,
                        address: log.address,
                        poolId: res.args.poolId ? res.args.poolId : UNKNOWN,
                        tokenIn: res.args.tokenIn ? res.args.tokenIn : UNKNOWN,
                        tokenOut: res.args.tokenOut ? res.args.tokenOut : UNKNOWN,
                        amountIn: res.args.amountIn ? res.args.amountIn : 0n,
                        amountOut: res.args.amountOut ? res.args.amountOut : 0n
                    })
                }else if(topic == EventsSignatureMap.Curve_TokenExchange){
                    const res = decodeEventLog({
                        abi: [SwapEventABIMap.Curve_TokenExchange],
                        data: log.data,
                        topics: log.topics,
                        strict: false
                    })
                    events.push({
                        protocol: SwapEvent.CURVE_TokenExchange,
                        address: log.address,
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

    static decodeTrxSwapEvent(log: Log[]): any | undefined {

    }
}