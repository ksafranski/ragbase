'use client';

import { ConfigProvider, theme } from 'antd';
import { ReactNode } from 'react';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#5B8DBE',
          colorBgBase: '#1a1d23',
          colorBgContainer: '#242933',
          colorBorder: '#3a3f4b',
          borderRadius: 10,
          fontSize: 14,
          controlHeight: 40,
          controlPaddingHorizontal: 16,
          fontFamily: "'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        components: {
          Layout: {
            headerBg: '#242933',
            siderBg: '#1a1d23',
            bodyBg: '#141519',
          },
          Card: {
            colorBgContainer: '#242933',
            actionsBg: '#242933',
            boxShadow: 'none',
            boxShadowSecondary: 'none',
            boxShadowTertiary: 'none',
          },
          Table: {
            colorBgContainer: '#242933',
          },
          Modal: {
            contentBg: '#242933',
            headerBg: '#242933',
          },
          Button: {
            controlHeight: 40,
            paddingContentHorizontal: 20,
            boxShadow: 'none',
            boxShadowSecondary: 'none',
          },
          Input: {
            controlHeight: 40,
            paddingBlock: 10,
            paddingInline: 16,
          },
          Select: {
            controlHeight: 40,
          },
          InputNumber: {
            controlHeight: 40,
            paddingBlock: 10,
            paddingInline: 16,
          },
          Menu: {
            itemBg: 'transparent',
            itemHoverBg: 'rgba(91, 141, 190, 0.1)',
            itemSelectedBg: 'rgba(91, 141, 190, 0.15)',
            itemActiveBg: 'rgba(91, 141, 190, 0.15)',
            itemSelectedColor: '#5B8DBE',
            itemColor: '#e6e8eb',
            itemHoverColor: '#ffffff',
            darkItemBg: 'transparent',
            darkItemHoverBg: 'rgba(91, 141, 190, 0.1)',
            darkItemSelectedBg: 'rgba(91, 141, 190, 0.15)',
            darkItemColor: '#e6e8eb',
            darkItemHoverColor: '#ffffff',
            darkItemSelectedColor: '#5B8DBE',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

