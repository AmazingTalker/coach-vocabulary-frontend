/**
 * 簡單的單一訂閱者 pub/sub 工具，用於觸發首頁資料刷新
 */

type RefreshCallback = () => void;

let subscriber: RefreshCallback | null = null;

export const refreshSignal = {
  /**
   * 註冊刷新回調（單一訂閱者）
   * @returns 取消訂閱函數
   */
  subscribe(callback: RefreshCallback): () => void {
    subscriber = callback;
    return () => {
      if (subscriber === callback) {
        subscriber = null;
      }
    };
  },

  /**
   * 觸發已註冊的刷新回調
   */
  trigger() {
    if (subscriber) {
      subscriber();
    }
  },
};
