/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */

const _ = require('lodash')

exports.helloWorld = async (req, res) => {

    // client signature, client RedeemScript, unsigned transaction object, which converted to hex, client public key
    const {clientSig, clientRedeemScript, rawTx} = req.body

    const BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default
    const BITBOX = new BITBOXCli({
        restURL: 'https://wormholecash-staging.herokuapp.com/v1/'
    })

    let node2 = BITBOX.HDNode.fromXPriv('72b87479a07e2a84f16703b821de03cb032f7a35a0863227f0d582e05115524b')
    let pubKeys = [
        BITBOX.HDNode.toPublicKey(node2)
    ];

    // decodeする
    let unsignedTransactionObj = await BITBOX.RawTransactions.decodeRawTransaction(rawTx)

    // 中身見る
    console.log(clientSig)
    console.log(clientRedeemScript)
    console.log(unsignedTransactionObj)

    let originalAmount = 6000; // TODO unsignedTransactionObjから取得する

    let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2PKH: 1 })
    let sendAmount = originalAmount - byteCount;

    let redeemScript = BITBOX.Script.multisig.output.encode(1, pubKeys)

    let txb = new BITBOX.TransactionBuilder()

    // TODO クライアントから送られてきたものを署名する
    txb.addInput('ad8aa0a977395128d2d8cc9c667e76262424fa760b7118a0450a090b92f30fac', 0) // TODO　re-add from unsignedTransactionObj.Input~
    txb.addOutput('bitcoincash:qpcxf2sv9hjw08nvpgffpamfus9nmksm3chv5zqtnz', sendAmount) // TODO  re-add from unsignedTransactionObj.Output~

    let key1 = BITBOX.HDNode.toKeyPair(node2);

    // sign from server
    txb.sign(0, key1, redeemScript, txb.hashTypes.SIGHASH_ALL, originalAmount)

    // sign with client signature // TODO
    txb.sign(0, clientRedeemScript, clientRedeemScript, txb.hashTypes.SIGHASH_ALL, originalAmount)

    // build and to hex
    let tx = txb.build()
    let hex = tx.toHex()

    try {
        // do transaction
        const result = await BITBOX.RawTransactions.sendRawTransaction(hex)
        console.log(result)
        res.json(result);

    } catch(err) {
        console.log(err)
        res.json(err)
    }
};
