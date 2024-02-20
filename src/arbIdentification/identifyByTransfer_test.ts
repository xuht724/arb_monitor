import { 
    http,
    createPublicClient,
} from 'viem';
import { mainnet } from "viem/chains";
import { identifyByTransfer } from './identifyByTransfer';

async function main() {
    const HTTP_NODE_URL =
    "https://eth-mainnet.g.alchemy.com/v2/AmGhouGifK4fNQtvtdZI_wQX1pdgHxQo";
    const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(HTTP_NODE_URL),
    });
    let testHashes = [
        '603761e4c2acdd3cef3a9e2e29f55009b18cdffd5696935bf59649910bb89943',
        'd9f9aad09530cc54bbff46e1847bea281f54862cb10a595ff2163b6fa44fcffd',
        '5739e2ab65ae48bbf60f89777a205d0056ddc0400f80034d05bb7526977cfad1',
        '6d9e998d9ef0b1c3920c72f64e29a066b9e8ac29fdb19cea66dbb283f09d5cc0'
    ];
    const iByTransfer = new identifyByTransfer(HTTP_NODE_URL);

    console.log("Start identifyByTransfer test");

    console.log("[1 rbitrage cycle with 2 exchanges]");
    let tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[0]}`
    });
    let [circles, pivots] = await iByTransfer.identifyArbByTransfer(tx_receipt);
    if(circles == undefined || pivots == undefined) console.log("test failed, nothing returned")
    else{
        for(let i = 0; i < circles.length; i++){
            console.log("cycle ", i, ":");
            circles[i].forEach(element => {
                console.log(element);
            });
            console.log("pivot: ", pivots[i]);
        }
    }

    console.log("[1 rbitrage cycle with 3 exchanges]");
    tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[2]}`
    });
    [circles, pivots] = await iByTransfer.identifyArbByTransfer(tx_receipt);
    if(circles == undefined || pivots == undefined) console.log("test failed, nothing returned")
    else{
        for(let i = 0; i < circles.length; i++){
            console.log("cycle ", i, ":");
            circles[i].forEach(element => {
                console.log(element);
            });
            console.log("pivot: ", pivots[i]);
        }
    }

    console.log("[2 rbitrage cycle]");
    tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[3]}`
    });
    [circles, pivots] = await iByTransfer.identifyArbByTransfer(tx_receipt);
    if(circles == undefined || pivots == undefined) console.log("test failed, nothing returned")
    else{
        for(let i = 0; i < circles.length; i++){
            console.log("cycle ", i, ":");
            circles[i].forEach(element => {
                console.log(element);
            });
            console.log("pivot: ", pivots[i]);
        }
    }
}

main();