(async() => {



    const BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default

    const BITBOX = new BITBOXCli({
        restURL: 'https://wormholecash-staging.herokuapp.com/v1/',
    })

    const BITBOX2 = new BITBOXCli({
        restURL: 'https://trest.bitbox.earth/v1/',
    })

    let wif = 'cRRhkLYKaqLqkKzewjJq2WsCr992fPM3ruGtpbH9NwUUkyqch1yj'
    let ecpair = BITBOX.ECPair.fromWIF(wif)
    let address = BITBOX.ECPair.toCashAddress(ecpair)

    let wif2 = 'cPrT2hSg7ZpYNVvbAweCMg9ip7EKB8BtrQQfv65wQduJ6uF1jXo7'
    let ecpair2 = BITBOX.ECPair.fromWIF(wif2)

    let wif3 = 'cVjHxs9sqevL79ZEptQqho6Y2y3RqiLaYafpMNCNUhokZPfmEqCM'
    let ecpair3 = BITBOX.ECPair.fromWIF(wif3)

    const createRawTx = (utxos) => {
        let utxo = utxos[0]

        let transactionBuilder = new BITBOX.TransactionBuilder('testnet')

        // 送信する BCH の値を計算
        let originalAmount = utxo.satoshis
        // let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2PKH: 1})
        let byteCount = 5000
        let sendAmount = originalAmount - byteCount

        // Input を追加
        transactionBuilder.addInput(utxo.txid, utxo.vout)

        let script = [
            BITBOX.Script.opcodes.OP_2,
            BITBOX.ECPair.toPublicKey(ecpair),
            BITBOX.Script.opcodes.OP_3,
            BITBOX.ECPair.toPublicKey(ecpair2),
            BITBOX.ECPair.toPublicKey(ecpair3),
            BITBOX.Script.opcodes.OP_CHECKMULTISIG
        ]

        let encodedScript = BITBOX.Script.encode(script)

        // Output を追加
        transactionBuilder.addOutput(encodedScript, 10000)

        // Output を追加
        transactionBuilder.addOutput(address, sendAmount-10000)

        // 署名
        let redeemScript
        transactionBuilder.sign(0, ecpair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, originalAmount)



        // Raw Tx を取得
        let tx = transactionBuilder.build()
        let rawTx = tx.toHex()

        return rawTx
    }


    try {

        let utxo;

        // create transaction
        let rawTx = createRawTx(utxo)

        // broadcast to the network
        let result = await BITBOX.RawTransactions.sendRawTransaction(rawTx)

        console.log(result)

    } catch (e) {
        console.error(e)
    }

})();