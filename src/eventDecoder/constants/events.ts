export const EventsSignatureMap = {
    Erc20_Transfer: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    UniV3_Swap: '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67',
    UniV2_Swap: '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
    BalancerVault_Swap: "0x2170c741c41531aec20e7c107c24eecfdd15e69c9bb0a8dd37b1840b9e0b207b",
    Curve_TokenExchange: "0x8b3e96f2b889fa771c53c981b40daf005f63f637f1869f707052d15a3dd97140",
    OneInch_OrderFilled: "0xb9ed0243fdf00f0545c63a0af8850c090d86bb46682baec4bf3c496814fe4f02",
    ZeroX_LimitOrderFilled: "0xab614d2b738543c0ea21f56347cf696a3a0c42a7cbec3212a5ca22a4dcff2124",
    UniswapX_Fill: "0x78ad7ec0e9f89e74012afa58738b6b661c024cb0fd185ee2f616c0a28924bd66"
} as const

export enum SwapEvent {
    UNIV3_Swap = 'UniV3_Swap',
    UNIV2_Swap = 'UniV2_Swap',
    BALANCERVAULT_Swap = 'BalancerVault_Swap',
    CURVE_TokenExchange = 'Curve_TokenExchange'
}

export enum OrderEvent {
    ONEINCH_OrderFilled = 'OneInch_OrderFilled',
    ZEROX_LimitOrderFilled = 'ZeroX_LimitOrderFilled',
    UNISWAPX_Fill = 'UniswapX_Fill'
}

export enum Protocol {
    UniswapV2 = "uniswapV2",
    UniswapV3 = "uniswapV3",
    SushiswapV2 = "sushiswapV2",
    SushiswapV3 = "sushiswapV3",
    PancakeswapV2 = "pancakeswapV2",
    PancakeswapV3 = "pancakeswapV3",
    Shibaswap = "shibaswap",
    Balancer = "balancer",
    Curve = "curve",
    OneInch = 'oneinch',
    ZeroX = 'zerox',
    UniswapX = 'uniswapx'
}

export enum PoolType {
    UNISWAP_V2_LIKE_POOL = "uniswap_v2_like_pool",
    UNISWAP_V3_LIKE_POOL = "uniswap_v3_like_pool",
    BALANCER_POOL = "balancer_pool",
    CURVE_POOL = "curve_pool",
    ORDER = 'order'
}

export const SwapEventABIMap = {
    UniV3_Swap: {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "int256",
                "name": "amount0",
                "type": "int256"
            },
            {
                "indexed": false,
                "internalType": "int256",
                "name": "amount1",
                "type": "int256"
            },
            {
                "indexed": false,
                "internalType": "uint160",
                "name": "sqrtPriceX96",
                "type": "uint160"
            },
            {
                "indexed": false,
                "internalType": "uint128",
                "name": "liquidity",
                "type": "uint128"
            },
            {
                "indexed": false,
                "internalType": "int24",
                "name": "tick",
                "type": "int24"
            }
        ],
        "name": "Swap",
        "type": "event"
    },
    UniV2_Swap: {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount0In",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount1In",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount0Out",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount1Out",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            }
        ],
        "name": "Swap",
        "type": "event"
    },
    BalancerVault_Swap: {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "poolId",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "contract IERC20",
                "name": "tokenIn",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "contract IERC20",
                "name": "tokenOut",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amountOut",
                "type": "uint256"
            }
        ],
        "name": "Swap",
        "type": "event"
    },
    Curve_TokenExchange: {
        "name": "TokenExchange",
        "inputs": [
            {
                "type": "address",
                "name": "buyer",
                "indexed": true
            },
            {
                "type": "int128",
                "name": "sold_id",
                "indexed": false
            },
            {
                "type": "uint256",
                "name": "tokens_sold",
                "indexed": false
            },
            {
                "type": "int128",
                "name": "bought_id",
                "indexed": false
            },
            {
                "type": "uint256",
                "name": "tokens_bought",
                "indexed": false
            }
        ],
        "anonymous": false,
        "type": "event"
    },
    OneInch_OrderFilled: {
        "anonymous":false,
        "inputs":[
            {
                "indexed":true,
                "internalType":"address",
                "name":"maker",
                "type":"address"
            },
            {
                "indexed":false,
                "internalType":"bytes32",
                "name":"orderHash",
                "type":"bytes32"
            },
            {
                "indexed":false,
                "internalType":"uint256",
                "name":"remaining",
                "type":"uint256"
            }
        ],
        "name":"OrderFilled",
        "type":"event"
    },
    ZeroX_LimitOrderFilled: {
        "anonymous": false,
        "inputs": [
            { "indexed": false, "internalType": "bytes32", "name": "orderHash", "type": "bytes32" },
            { "indexed": false, "internalType": "address", "name": "maker", "type": "address" },
            { "indexed": false, "internalType": "address", "name": "taker", "type": "address" },
            { "indexed": false, "internalType": "address", "name": "feeRecipient", "type": "address" },
            { "indexed": false, "internalType": "address", "name": "makerToken", "type": "address" },
            { "indexed": false, "internalType": "address", "name": "takerToken", "type": "address" },
            {
                "indexed": false,
                "internalType": "uint128",
                "name": "takerTokenFilledAmount",
                "type": "uint128"
            },
            {
                "indexed": false,
                "internalType": "uint128",
                "name": "makerTokenFilledAmount",
                "type": "uint128"
            },
            {
                "indexed": false,
                "internalType": "uint128",
                "name": "takerTokenFeeFilledAmount",
                "type": "uint128"
            },
            { "indexed": false, "internalType": "uint256", "name": "protocolFeePaid", "type": "uint256" },
            { "indexed": false, "internalType": "bytes32", "name": "pool", "type": "bytes32" }
        ],
        "name": "LimitOrderFilled",
        "type": "event"
    },
    UniswapX_Fill: {
        "anonymous":false,
        "inputs": [
            {
                "indexed":true,
                "internalType":"bytes32",
                "name":"orderHash",
                "type":"bytes32"
            },
            {
                "indexed":true,
                "internalType":"address",
                "name":"filler",
                "type":"address"
            },
            {
                "indexed":true,
                "internalType":"address",
                "name":"swapper",
                "type":"address"
            },
            {
                "indexed":false,
                "internalType":"uint256",
                "name":"nonce",
                "type":"uint256"
            }
        ],
        "name":"Fill",
        "type":"event"
    }
} as const
