// サイトで使っているイメージ写真（自社の施工写真ではないもの）の出典。
// CC BY 2.0 の条件（撮影者名・出典・ライセンスへのリンク・加工の有無）をフッターに表示する。
// 自社の写真に差し替えたら、ここから外す。
export type PhotoCredit = {
  src: string; // public/ 以下のパス
  author: string;
  source: string; // Wikimedia Commons のファイルページ
  license: string;
  licenseUrl: string;
};

export const PHOTO_CREDITS: PhotoCredit[] = [
  {
    src: '/images/stock/roller-wall.jpg',
    author: 'Michael Cory',
    source: 'https://commons.wikimedia.org/wiki/File:Paint_roller_4.jpg',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
  {
    src: '/images/stock/tools-tray.jpg',
    author: 'whereareyousimon',
    source: 'https://commons.wikimedia.org/wiki/File:Tray,_brush,_roller,_paint_(4116925693).jpg',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
];
