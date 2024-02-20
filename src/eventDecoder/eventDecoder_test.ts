import { 
    http,
    createPublicClient,
} from 'viem';
import { mainnet } from "viem/chains";
import { TransferEvent, UniV2SwapEvent, UniV3SwapEvent, BalancerVaultSwapEvent, CurveTokenExchangeEvent } from './types/events';
import { EventDecoder } from "./eventDecoder";
import { SwapEvent } from './constants/events';

async function main(){
    const HTTP_NODE_URL =
    "https://eth-mainnet.g.alchemy.com/v2/AmGhouGifK4fNQtvtdZI_wQX1pdgHxQo";
    const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(HTTP_NODE_URL),
    });
    let testHashes = [
        '603761e4c2acdd3cef3a9e2e29f55009b18cdffd5696935bf59649910bb89943',
        '30b2db62b5af81a6413553702932563bfe462ee487e80d5a34064aadc6ab8a4e',
        '5739e2ab65ae48bbf60f89777a205d0056ddc0400f80034d05bb7526977cfad1',
        '1598fd63696d74fc6c4933a063112377b33d978e5d3b5a5a2b63961e3fa6b2bf'
    ];

    console.log("Start eventDecoder test");

    console.log("[ERC20 Transfer event]");
    let tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[0]}`
    });
    let transferEvents = EventDecoder.decodeErc20Transfers(tx_receipt.logs);
    if(transferEvents.length == 0) console.log("test failed, nothing returned");
    else{
        console.log("address: ", transferEvents[0].address);
        console.log("from: ", transferEvents[0].from);
        console.log("to: ", transferEvents[0].to);
        console.log("value: ", transferEvents[0].value);
    }

    console.log("[UniV2 Swap event]")
    tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[2]}`
    });
    let swapEvents = EventDecoder.decodeTrxSwapEvents(tx_receipt.logs);
    if(swapEvents.length == 0) console.log("test failed, nothing returned");
    else{
        for(let e of swapEvents){
            if(e.protocol == SwapEvent.UNIV2_Swap){
                console.log("address: ", e.address);
                console.log("from: ", e.from);
                console.log("to: ", e.to);
                console.log("amount0In: ", e.amount0In);
                console.log("amount0Out: ", e.amount0Out);
                console.log("amount1In: ", e.amount1In);
                console.log("amount1Out: ", e.amount1Out);
                break;
            }
        } 
    }

    console.log("[UniV3 Swap event]")
    tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[0]}`
    });
    swapEvents = EventDecoder.decodeTrxSwapEvents(tx_receipt.logs);
    if(swapEvents.length == 0) console.log("test failed, nothing returned");
    else{
        for(let e of swapEvents){
            if(e.protocol == SwapEvent.UNIV3_Swap){
                console.log("address: ", e.address);
                console.log("from: ", e.from);
                console.log("to: ", e.to);
                console.log("amount0: ", e.amount0);
                console.log("amount1: ", e.amount1);
                console.log("sqrtPriceX96: ", e.sqrtPriceX96);
                console.log("liquidity: ", e.liquidity);
                console.log("tick: ", e.tick);
                break;
            }
        } 
    }

    console.log("[Balancer Swap event]")
    tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[1]}`
    });
    swapEvents = EventDecoder.decodeTrxSwapEvents(tx_receipt.logs);
    if(swapEvents.length == 0) console.log("test failed, nothing returned");
    else{
        for(let e of swapEvents){
            if(e.protocol == SwapEvent.BALANCERVAULT_Swap){
                console.log("address: ", e.address);
                console.log("poolId: ", e.poolId);
                console.log("tokenIn: ", e.tokenIn);
                console.log("tokenOut: ", e.tokenOut);
                console.log("amountIn: ", e.amountIn);
                console.log("amountOut: ", e.amountOut);
                break;
            }
        } 
    }

    console.log("[Curve Token Exchange event]")
    tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[3]}`
    });
    swapEvents = EventDecoder.decodeTrxSwapEvents(tx_receipt.logs);
    if(swapEvents.length == 0) console.log("test failed, nothing returned");
    else{
        for(let e of swapEvents){
            if(e.protocol == SwapEvent.CURVE_TokenExchange){
                console.log("address: ", e.address);
                console.log("buyer: ", e.buyer);
                console.log("sold_id: ", e.sold_id);
                console.log("tokens_sold: ", e.tokens_sold);
                console.log("bought_id: ", e.bought_id);
                console.log("tokens_bought: ", e.tokens_bought);
                break;
            }
        } 
    }
}

main();