import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-thai",
});

export const metadata = {
  title: "ระบบ MIS — แผนกวิชาเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคเชียงใหม่",
  description:
    "ระบบสารสนเทศเพื่อการจัดการงานพัสดุและงานการเงิน แผนกวิชาเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคเชียงใหม่",
};

export const viewport = {
  themeColor: "#151f4e",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={notoThai.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
