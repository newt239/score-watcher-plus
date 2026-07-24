import { cdate } from "cdate";

/** 表示に使うタイムゾーン */
const DISPLAY_TIME_ZONE = "Asia/Tokyo";

/**
 * 日時を日本時間で整形する
 *
 * サーバー（Workers上ではUTC）とブラウザ（利用者のタイムゾーン）で結果が変わると ハイドレーションが一致しなくなるため、表示用のタイムゾーンを固定します。
 *
 * @param value 整形する日時
 * @param format Cdateの書式
 * @returns 整形済みの文字列
 */
export const formatDisplayDate = (value: string | Date, format: string) => {
  return cdate(value).tz(DISPLAY_TIME_ZONE).format(format);
};
