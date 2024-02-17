import { TransferEvent } from "../eventDecoder/types/events";

export class TrxAnalyzer {
    static analyseAddressTokenNetProfit(events: TransferEvent[]) {
        let addressTokenProfitMap = new Map<string, Map<string, bigint>>();
        for (const event of events) {
            // Update profit for 'from' address
            if (addressTokenProfitMap.has(event.from)) {
                const fromMap = addressTokenProfitMap.get(event.from) as Map<string, bigint>;
                let fromProfit = BigInt(0);
                if (fromMap.has(event.address)) {
                    fromProfit = fromMap.get(event.address) as bigint;
                }
                fromProfit -= event.value;
                fromMap.set(event.address, fromProfit);
            } else {
                const fromMap = new Map<string, bigint>();
                fromMap.set(event.address, -event.value);
                addressTokenProfitMap.set(event.from, fromMap);
            }
            // Update profit for 'to' address
            if (addressTokenProfitMap.has(event.to)) {
                const toMap = addressTokenProfitMap.get(event.to) as Map<string, bigint>;
                let toProfit = BigInt(0);
                if (toMap.has(event.address)) {
                    toProfit = toMap.get(event.address) as bigint;
                }
                toProfit += event.value;
                toMap.set(event.address, toProfit);
            } else {
                const toMap = new Map<string, bigint>();
                toMap.set(event.address, event.value);
                addressTokenProfitMap.set(event.to, toMap);
            }
        }

        return addressTokenProfitMap
    }


}