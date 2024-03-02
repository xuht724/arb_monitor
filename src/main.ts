import { ChainStateHelper } from "./chainStateHelper.ts/chainStateHelper";
import { HTTP_NODE_URL } from "./config";
import { writeFileSync, readFileSync } from 'fs'
import { replacer, reviver } from "./utils/utils";
import { BlockMetadata } from "./eventDecoder/types/block";
import { EventDecoder } from "./eventDecoder/eventDecoder";
import { IdentifyByTransfer } from "./arbIdentification/identifyByTransfer";

async function main() {
    let block_list: any[] = []
    let chainStateHelper = new ChainStateHelper(HTTP_NODE_URL);
    let number = 19333668
    let block = await chainStateHelper.downloadBlockMetadata(number);
    block_list.push(block)
    writeFileSync(`./data/${number}.json`, JSON.stringify(block_list, replacer));

    let data = JSON.parse(readFileSync(`./data/${number}.json`).toString(), reviver);

    let arbTrx: any[] = []
    for (const block of data) {
        let blockMetadata = block as BlockMetadata;
        for (const receipt of blockMetadata.receipts) {
            let transferEvents = EventDecoder.decodeErc20Transfers(receipt.logs);
            let res = IdentifyByTransfer.identifyArbByTransfer(receipt, transferEvents);
            let addressTokenProfit = IdentifyByTransfer.analyseAddressTokenProfit(transferEvents);
            if (res.isArb == true) {
                console.log(receipt.to);
                console.log(receipt.transactionHash);
                console.log(addressTokenProfit);
                console.log(res);
            }
        }
    }

}
main()