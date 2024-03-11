import { 
    http,
    createPublicClient,
} from 'viem';
import { mainnet } from "viem/chains";
import { TransferEvent, UniV2SwapEvent, UniV3SwapEvent, BalancerVaultSwapEvent, CurveTokenExchangeEvent } from './types/events';
import { EventDecoder } from "./eventDecoder";
import { SwapEvent, PoolType, Protocol } from './constants/events';
import { HTTP_NODE_URL, sqlite_database } from '../config';
import { SqliteHelper } from '../sqliteHelper';

async function main(){
    const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(HTTP_NODE_URL),
    });
    const sqliteHelper = new SqliteHelper(sqlite_database);
    let testHashes = [
        '603761e4c2acdd3cef3a9e2e29f55009b18cdffd5696935bf59649910bb89943',
        '30b2db62b5af81a6413553702932563bfe462ee487e80d5a34064aadc6ab8a4e',
        '5739e2ab65ae48bbf60f89777a205d0056ddc0400f80034d05bb7526977cfad1',
        '1598fd63696d74fc6c4933a063112377b33d978e5d3b5a5a2b63961e3fa6b2bf',
        'dca5ab5f124448c7e693bd99192d7e60a9b131587803b3790160d6e01e8739c3',
        '909bf4a079bc8542babfaf6a20bd4cc0808e493f067e89df9d9c1e0ad87856e8',
        '66d3fdbf8658e4e04603bdfe8725851fd503c2a312f15710345b834d047f89ad'
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
    let swapEvents = await EventDecoder.decodeTrxSwapEvents(tx_receipt.logs, sqliteHelper);
    if(swapEvents.length == 0) console.log("test failed, nothing returned");
    else{
        for(let e of swapEvents){
            if(e.basicInfo.poolType == PoolType.UNISWAP_V2_LIKE_POOL){
                console.log("protocol: ", e.basicInfo.protocol);
                console.log("address: ", e.basicInfo.address);
                console.log("from: ", e.from);
                console.log("to: ", e.to);
                console.log("amount0In: ", e.amount0In);
                console.log("amount0Out: ", e.amount0Out);
                console.log("amount1In: ", e.amount1In);
                console.log("amount1Out: ", e.amount1Out);
            }
        } 
    }

    console.log("[UniV3 Swap event]")
    tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[0]}`
    });
    swapEvents = await EventDecoder.decodeTrxSwapEvents(tx_receipt.logs, sqliteHelper);
    if(swapEvents.length == 0) console.log("test failed, nothing returned");
    else{
        for(let e of swapEvents){
            if(e.basicInfo.poolType == PoolType.UNISWAP_V3_LIKE_POOL){
                console.log("protocol: ", e.basicInfo.protocol);
                console.log("address: ", e.basicInfo.address);
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
    swapEvents = await EventDecoder.decodeTrxSwapEvents(tx_receipt.logs, sqliteHelper);
    if(swapEvents.length == 0) console.log("test failed, nothing returned");
    else{
        for(let e of swapEvents){
            if(e.basicInfo.poolType == PoolType.BALANCER_POOL){
                console.log("protocol: ", e.basicInfo.protocol);
                console.log("address: ", e.basicInfo.address);
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
    swapEvents = await EventDecoder.decodeTrxSwapEvents(tx_receipt.logs, sqliteHelper);
    if(swapEvents.length == 0) console.log("test failed, nothing returned");
    else{
        for(let e of swapEvents){
            if(e.basicInfo.poolType == PoolType.CURVE_POOL){
                console.log("protocol: ", e.basicInfo.protocol);
                console.log("address: ", e.basicInfo.address);
                console.log("buyer: ", e.buyer);
                console.log("sold_id: ", e.sold_id);
                console.log("tokens_sold: ", e.tokens_sold);
                console.log("bought_id: ", e.bought_id);
                console.log("tokens_bought: ", e.tokens_bought);
                break;
            }
        } 
    }

    console.log("[1inch orderFilled event]")
    tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[4]}`
    });
    swapEvents = await EventDecoder.decodeTrxOrderEvents(tx_receipt.logs, sqliteHelper);
    if(swapEvents.length == 0) console.log("test failed, nothing returned");
    else{
        for(let e of swapEvents){
            if(e.basicInfo.protocol == Protocol.OneInch){
                console.log("protocol: ", e.basicInfo.protocol);
                console.log("address: ", e.basicInfo.address);
                console.log("maker: ", e.maker);
                console.log("orderHash: ", e.orderHash);
                console.log("remaining: ", e.remaining);
                break;
            }
        } 
    }

    console.log("[0x LimitOrderFilled event]")
    tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[5]}`
    });
    swapEvents = await EventDecoder.decodeTrxOrderEvents(tx_receipt.logs, sqliteHelper);
    if(swapEvents.length == 0) console.log("test failed, nothing returned");
    else{
        for(let e of swapEvents){
            if(e.basicInfo.protocol == Protocol.ZeroX){
                console.log("protocol: ", e.basicInfo.protocol);
                console.log("address: ", e.basicInfo.address);
                console.log("orderHash: ", e.orderHash);
                console.log("maker: ", e.maker);
                console.log("taker: ", e.taker);
                console.log("feeRecipient: ", e.feeRecipient);
                console.log("makerToken: ", e.makerToken);
                console.log("takerToken: ", e.takerToken);
                console.log("takerTokenFilledAmount: ", e.takerTokenFilledAmount);
                console.log("makerTokenFilledAmount: ", e.makerTokenFilledAmount);
                console.log("takerTokenFeeFilledAmount: ", e.takerTokenFeeFilledAmount);
                console.log("protocolFeePaid: ", e.protocolFeePaid);
                console.log("pool: ", e.pool);
                break;
            }
        } 
    }

    console.log("[UniswapX Fill event]")
    tx_receipt = await publicClient.getTransactionReceipt({
        hash: `0x${testHashes[6]}`
    });
    swapEvents = await EventDecoder.decodeTrxOrderEvents(tx_receipt.logs, sqliteHelper);
    if(swapEvents.length == 0) console.log("test failed, nothing returned");
    else{
        for(let e of swapEvents){
            if(e.basicInfo.protocol == Protocol.UniswapX){
                console.log("protocol: ", e.basicInfo.protocol);
                console.log("address: ", e.basicInfo.address);
                console.log("orderHash: ", e.orderHash);
                console.log("filler: ", e.filler);
                console.log("swapper: ", e.swapper);
                console.log("nonce: ", e.nonce);
                break;
            }
        } 
    }
}

main();