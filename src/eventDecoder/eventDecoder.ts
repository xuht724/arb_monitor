import { Log, decodeEventLog } from 'viem';
import { TransferEvent } from './types/events';
import { UNKNOWN } from '../constants/common'
export class EventDecoder {
    static decodeErc20Transfers(logs: Log[]): TransferEvent[] {
        let events: TransferEvent[] = []
        for (const log of logs) {
            const topics = decodeEventLog({
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
                from: topics.args.src ? topics.args.src : UNKNOWN,
                to: topics.args.dst ? topics.args.dst : UNKNOWN,
                value: topics.args.wad ? topics.args.wad : 0n
            })
        }
        return events;
    }

    // static decodeSwaps
}