import type { NextPageContext } from 'next'
import Head from 'next/head'

interface ErrorPageProps {
  statusCode?: number
}

export default function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>Error - Danoscar Bite</title>
      </Head>
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">
          {statusCode || 'Error'}
        </h1>
        <p className="text-gray-600 mb-6">
          {statusCode === 404
            ? 'Page not found'
            : statusCode
              ? `An error ${statusCode} occurred`
              : 'An unexpected error occurred'}
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
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
