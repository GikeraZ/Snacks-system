import type { NextPageContext } from 'next'
import Head from 'next/head'

interface ErrorPageProps {
  statusCode?: number
}

export default function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Head>
        <title>Error - Hot Take</title>
      </Head>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <span className="text-4xl font-bold text-red-500">{statusCode || '!'}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading mb-2">
          {statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {statusCode === 404
            ? 'The page you are looking for does not exist or has been moved.'
            : statusCode
              ? `An error ${statusCode} occurred on the server.`
              : 'An unexpected error occurred. Please try again.'}
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:translate-y-[-1px] transition-all"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
