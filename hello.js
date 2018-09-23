/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */

const BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default
const BITBOX = new BITBOXCli({
    restURL: 'https://wormholecash-staging.herokuapp.com/v1/'
})

const _ = require('lodash')

exports.helloWorld = async (req, res) => {

    // サーバー側のアドレス
    let wif = 'cRRhkLYKaqLqkKzewjJq2WsCr992fPM3ruGtpbH9NwUUkyqch1yj'
    let ecpair = BITBOX.ECPair.fromWIF(wif)
    let address = BITBOX.ECPair.toCashAddress(ecpair)

    // instance of transaction builder
    let transactionBuilder = new BITBOX.TransactionBuilder('testnet')

    // クライアントから送られてくるクライアントのシグネイチャー、redeemScript,そしてアンサインドトランザクションのhex
    const {clientSig, clientRedeemScript, rawTx, publicKey} = req.body;

    try {
        // decodeする
        let unsignedTransactionObj = await BITBOX.RawTransactions.decodeRawTransaction(rawTx)[0]

        // txid of vout
        let txid = _.get(unsignedTransactionObj, 'txid')

        // add input with txid and index of vout
        transactionBuilder.addInput(txid, 0);

        let originalAmount = 10;　// TODO from unsignedからとる

        // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
        let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2PKH: 1 });
        let sendAmount = originalAmount - byteCount;

        // add output w/ address and amount to send //TODO unsignedからとる
        transactionBuilder.addOutput('', sendAmount)

        // node of address which is going to spend utxo
        let hdnode = BITBOX.HDNode.fromXPriv("xprvA3eaDg64MwDr72PVGJ7CkvshNAzCDRz7rn98sYrZVAtDSWCAmNGQhEQeCLDcnmcpSkfjhHevXmu4ZL8ZcT9D4vEbG8LpiToZETrHZttw9Yw")
        // keypair
        let keyPair = BITBOX.HDNode.toKeyPair(hdnode);

        // 自身のsign
        let redeemScript;
        transactionBuilder.sign(0, keyPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, originalAmount)

        // TODO clientから送られてきたsignatureを使ってsign

        // build transaction
        let tx = transactionBuilder.build();
        // output rawhex
        let hex = tx.toHex();

        let sendRawTransaction = await BITBOX.RawTransactions.sendRawTransaction([hex])

        console.log(sendRawTransaction)
    } catch(e) {
        console.log('-----error------')
        console.log(e)
    }
};
