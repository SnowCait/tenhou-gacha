# 天和ガチャ

親の配牌 14 枚をランダムに引いて、約 33 万分の 1 の奇跡「天和」を狙う Web アプリ。

## 機能

- **配牌**: ボタンを押すとランダムに 14 枚配牌し、向聴数を表示。天和(和了形)なら演出が発動。
- **配牌を繰り返す**: 「天和になるまで」または「指定回数まで」(最大 1 億回)配牌を高速に繰り返し、試行回数・天和回数(とその手牌)・向聴数分布を表示。

## 技術構成

- [SvelteKit](https://svelte.dev/docs/kit) (adapter-static) + Tailwind CSS v4 + [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) (日本語 / English)
- 配牌と向聴数計算のホットループは Rust 製 Wasm(約 300〜400 万配牌/秒)
  - 向聴数計算: [xiangting](https://github.com/Apricot-S/xiangting) (MIT)
  - Web Worker 上でチャンク実行し、進捗表示と停止に対応
- 牌画像: [FluffyStuff/riichi-mahjong-tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles) (CC0)

## セットアップ

Node.js 22+ と Rust(stable)が必要。

```sh
rustup target add wasm32-unknown-unknown
npm install
```

wasm-pack は devDependency として入るため個別インストールは不要。

## 開発

```sh
npm run dev        # Wasm をビルドして開発サーバーを起動
npm run build      # 本番ビルド (build/ に静的サイトを出力)
npm run preview    # 本番ビルドをプレビュー
```

## テスト

```sh
cargo test --manifest-path wasm/Cargo.toml   # Rust ユニットテスト
npm run test:unit -- --run                   # vitest (ロジック + コンポーネント)
npm run test:e2e                             # Playwright E2E
npm run lint && npm run check
```

Playwright がブラウザをダウンロードできない環境では、環境変数
`PLAYWRIGHT_CHROMIUM_PATH` に既存の Chromium 実行ファイルを指定するとそれを使用する。
