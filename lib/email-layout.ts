export interface MotoEmailLayoutOptions {
  title: string
  preheader?: string
  statusBadge?: { label: string; tone?: 'success' | 'warning' | 'info' }
  children: string
  logoUrl?: string
}

export function MotoEmailLayout({
  title,
  preheader = '',
  statusBadge,
  children,
  logoUrl = 'https://www.motokitchen.nl/motoemaillogo.jpg',
}: MotoEmailLayoutOptions) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #FAF6EF;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            color: #1f1f1f;
          }
          .preheader {
            display: none !important;
            visibility: hidden;
            font-size: 1px;
            line-height: 1px;
            max-height: 0;
            max-width: 0;
            opacity: 0;
            overflow: hidden;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
          }
          .header {
            padding: 24px 32px 12px;
            text-align: center;
            border-bottom: 1px solid #e6d9c8;
          }
          .logo {
            max-height: 56px;
            margin-bottom: 12px;
          }
          h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #3a2a24;
          }
          .badge {
            display: inline-block;
            margin-top: 8px;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
          }
          .badge.success {
            background: #e5f5ed;
            color: #1b7a46;
            border: 1px solid #cfe6d7;
          }
          .badge.warning {
            background: #fff4e5;
            color: #a85e00;
            border: 1px solid #ffe3bf;
          }
          .badge.info {
            background: #eaf0ff;
            color: #1b4fa0;
            border: 1px solid #d5e3ff;
          }
          .content {
            padding: 28px 32px 24px;
          }
          .card {
            border-radius: 12px;
            border: 1px solid #e6d9c8;
            padding: 18px 20px;
            background: #fffdf8;
            margin-bottom: 14px;
          }
          .card h3 {
            margin: 0 0 8px;
            font-size: 16px;
            color: #3a2a24;
            font-weight: 600;
          }
          .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 18px;
          }
          .pill {
            background: #f4ebe1;
            border-radius: 999px;
            padding: 10px 14px;
            font-size: 13px;
            font-weight: 600;
            text-align: center;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          .table th,
          .table td {
            text-align: left;
            padding: 8px 6px;
            border-bottom: 1px solid #f0e7db;
            font-size: 13px;
          }
          .table th {
            color: #6b5b53;
            font-weight: 600;
          }
          .totals {
            margin-top: 10px;
            font-size: 13px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
          }
          .totals-row.total {
            font-size: 14px;
            font-weight: 700;
            color: #3a2a24;
          }
          .cta-wrap {
            margin-top: 16px;
          }
          .btn {
            display: inline-block;
            padding: 12px 18px;
            border-radius: 6px;
            border: 1px solid #e6d9c8;
            background: #faf6f0;
            color: #1f1f1f;
            font-weight: 600;
            font-size: 14px;
            text-decoration: none;
            margin-right: 8px;
          }
          .btn:hover {
            background: #f5f1e8;
          }
          .footer {
            padding: 24px 32px 28px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e6d9c8;
            background: #faf6ef;
          }
          .footer a {
            color: #c9653b;
            text-decoration: none;
          }
          @media only screen and (max-width: 600px) {
            .content {
              padding: 22px 18px 18px;
            }
            .grid-3 {
              grid-template-columns: 1fr;
            }
            .card {
              padding: 16px;
            }
          }
        </style>
      </head>
      <body>
        <span class="preheader">${preheader}</span>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="Moto Kitchen" class="logo" />
            <h1>${title}</h1>
            ${statusBadge ? `<div class="badge ${statusBadge.tone || 'info'}">${statusBadge.label}</div>` : ''}
          </div>
          <div class="content">
            ${children}
          </div>
          <div class="footer">
            <p style="margin:0;"><strong>Moto Kitchen</strong> | East African Catering</p>
            <p style="margin:6px 0 0;"><a href="mailto:contact@motokitchen.nl">contact@motokitchen.nl</a></p>
            <p style="margin:4px 0 0;">Instagram: <a href="https://instagram.com/motokitchen.nl">@motokitchen.nl</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}

