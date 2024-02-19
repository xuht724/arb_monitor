import { Log, decodeEventLog } from 'viem';
import { TransferEvent } from './types/events';
import { UNKNOWN } from '../constants/common'
import { EventsSignatureMap } from './constants/events';
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

        }

        return events;
    }

    static decodeTrxSwapEvent(log: Log[]): any | undefined {

    }


}