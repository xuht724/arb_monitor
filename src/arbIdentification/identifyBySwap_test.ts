import { 
    http,
    createPublicClient,
} from 'viem';
import { mainnet } from "viem/chains";
import { identifyBySwap } from './identifyBySwap';
import { EventDecoder } from '../eventDecoder/eventDecoder';
import { HTTP_NODE_URL, sqlite_database } from '../config';

async function main() {
    const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(HTTP_NODE_URL),
    });
    let testHashes = [
        '603761e4c2acdd3cef3a9e2e29f55009b18cdffd5696935bf59649910bb89943',
        'd9f9aad09530cc54bbff46e1847bea281f54862cb10a595ff2163b6fa44fcffd',
        '5739e2ab65ae48bbf60f89777a205d0056ddc0400f80034d05bb7526977cfad1',
        '6d9e998d9ef0b1c3920c72f64e29a066b9e8ac29fdb19cea66dbb283f09d5cc0',
        '6d4ea697b0c813c290541840241a945bfd8a1b1d8cfda13d7799ccd86fc2800b',
        '7ab15ac8d67bb194fc637afbbfa8b4d9f93fd344c099fe29b92e35624a385b1e',
        '5d9b2ccaf5d40349eec965518bf21da51880c89d04f0e58dd135b92e77c0369f'
    ];
    const iBySwap = new identifyBySwap(HTTP_NODE_URL, sqlite_database);

    console.log("Start identifyByTransfer test");
    console.log("[test]");
    let tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[0]}`
    });
    let tx = await publicClient.getTransaction({
        hash: `0x${testHashes[0]}`
    })
    let swapEvents = await EventDecoder.decodeTrxSwapEvents(tx_receipt.logs);
    let [isArb, circles, profits] = await iBySwap.identifyArbBySwap(tx_receipt, swapEvents);
    if(!isArb) console.log("test failed, nothing returned")
    else{
        for(let i = 0; i < circles!.length; i++){
            console.log("cycle ", i, ":");
            circles![i].forEach((element: any) => {
                console.log(element);
            });
            console.log("profit: ", profits![i]);
        }
    }
}

main();