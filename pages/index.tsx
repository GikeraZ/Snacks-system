import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'

export default function Home() {
  return <></>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login?callbackUrl=%2Fadmin%2Fdashboard',
        permanent: false,
      },
    }
  }

  const role = session.user?.role || ''
  const destination =
    role === 'SUPER_ADMIN' || role === 'BUSINESS_PARTNER'
      ? '/admin/dashboard'
      : role === 'CASHIER'
        ? '/cashier/dashboard'
        : role === 'KITCHEN_STAFF'
          ? '/kitchen/orders'
          : role === 'DELIVERY'
            ? '/delivery/orders'
            : role === 'CUSTOMER'
              ? '/customer'
              : '/auth/login'

  return {
    redirect: {
      destination,
      permanent: false,
    },
  }
}
