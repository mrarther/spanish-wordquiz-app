import { useRegisterSW } from 'virtual:pwa-register/react'

/** オフライン対応の完了と、新しいバージョンの公開を知らせる */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!offlineReady && !needRefresh) return null

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-20 mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-3 text-sm shadow-md"
    >
      <p className="flex-1">
        {needRefresh
          ? '新しいバージョンがあります。更新すると画面を読み込み直します。'
          : 'オフラインでも使えるようになりました。'}
      </p>
      {needRefresh && (
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="rounded-md bg-blue-600 px-3 py-1 font-semibold text-white hover:bg-blue-700"
        >
          更新
        </button>
      )}
      <button
        type="button"
        onClick={close}
        className="rounded-md border border-line px-3 py-1 hover:bg-surface-muted"
      >
        {needRefresh ? 'あとで' : '閉じる'}
      </button>
    </div>
  )
}
