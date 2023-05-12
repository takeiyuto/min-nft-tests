# Minimum NFT Tests

ERC-721 のスマート コントラクトに対する最低限の動作チェックを行うテスト コードのサンプルです。

## このブランチについて

この `typescript` ブランチのコードは、[TypeScript](https://www.typescriptlang.org/) で記述されています。[package.json](./package.json) の下記の指定によって、テスト ランナー Mocha に `ts-node` ライブラリを使うよう指示することで、直接 TypeScript で記述されたテスト スクリプトを実行します。
```json
"test": "mocha --exit --recursive --timeout 10s -r ts-node/register test/**/*.ts"
```

## 動作方法

1. 適切なディレクトリでこのレポジトリをクローンし、ライブラリをダウンロードします。
```bash
git clone https://github.com/takeiyuto/min-nft-tests.git
cd min-nft-tests
yarn
```

2. コンパイルし、テストを行います。
```bash
yarn truffle compile
yarn test
```

3. 以下のような出力が出ていれば、テストに成功しています。
```
デプロイ直後
  ✔ トークンの設定は正しいです。
  ✔ コントラクトは ETH を受け取りません。
  ✔ デプロイ後に所有しているトークンはありません。
  ✔ デプロイしたアドレスが、コントラクトの所有者です。
  ✔ 管理者はトークンを発行することができます。
  ✔ ユーザーはトークンを発行できません。

トークン ミントの後
  ✔ 所有者はトークンを消却できます。
  ✔ ユーザーはトークンを消却できません。
  ✔ 所有者は存在しないトークンを消す却できません。
  ✔ ユーザーは所有するトークンを移転できます。
  ✔ ユーザーは所有しないトークンを移転できません。
  ✔ 移転されたトークンも消却できます。

コントラクト所有者の設定
  ✔ 新しい所有者に変更し、新しい所有者がトークンを発行します。
  ✔ 自分を所有者ではないようにします。
  ✔ 所有者でない者による操作はエラーします。

15 passing (3s)
```

4. [Minimum.sol](./contracts/Minimum.sol) の以下の行を `//` でコメントアウトして再び手順 2. を行うと、今度はいくつかのテストが失敗することを確認できます。
```solidity
_mint(to, tokenId);
```

## `npm`と`yarn`

`yarn` は `npm` と同様、Node.js 向けのパッケージ マネージャです。次のコマンドで、システム全体で使えるように、インストールできます (macOS や Linux では、システム ディレクトリに書き込む権限を得るため、先頭に `sudo` が必要になるかもしれません)。
```bash
npm install -g yarn
```

`yarn` を使わない場合、上記の手順を次のように読み替えると、`npm` でも同じように実行できます。
* 引数のない単独の `yarn` コマンドは `npm install` にする。
* `yarn test` コマンドは、`yarn` を `npm run` に読み替える。
* `yarn truffle compile` コマンドは、`yarn` を `npx` に読み替える。

## 既知の問題

[truffle-config.js](./truffle-config.js) で、Solidity コンパイラのバージョンを指定しています。
```js
version: "0.8.19"
```

このとき `0.8.20` 以上を指定すると、`yarn test` コマンドを実行したときに `invalid opcode` というエラーが出力され、すべてのテストが失敗するようになります。これは、`0.8.20` 以上の Solidity コンパイラでは既定で Shanghai バージョンの EVM を対象としたコンパイルが行われて `PUSH0` オペコードを出力するようになる一方、`@openzeppelin/test-environment` で内部的に利用している Ganache のバージョンが古いことに起因します。

## ライセンス表示

このサンプル コードは、[MIT License](LICENSE)で提供しています。

# 参照

[徹底解説 NFTの理論と実践](https://www.ohmsha.co.jp/book/9784274230608/)の第5章6節2項を参照してください。[本書の Web サイト](https://takeiyuto.github.io/nft-book)も参考にしてください。
