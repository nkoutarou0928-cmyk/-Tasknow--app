import "dotenv/config";
import express from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// データベースへの接続設定じゃ
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter, log: ["query"] });

const app = express();
const PORT = process.env.PORT || 8888;

// EJS を使って画面（ビュー）を作る設定じゃ
app.set("view engine", "ejs");
app.set("views", "./views");
// フォームから送られてきたデータを受け取れるようにする設定じゃ
app.use(express.urlencoded({ extended: true }));

// トップページ（/）にアクセスしたときの処理じゃ
app.get("/", async (req, res) => {
  const users = await prisma.user.findMany();
  // views/index.ejs を表示するぞ。そのとき users データを渡すのじゃ
  res.render("index", { users });
});

// ユーザーを追加するボタンが押されたときの処理じゃ
app.post("/users", async (req, res) => {
  const name = req.body.name;
  if (name) {
    await prisma.user.create({ data: { name } });
  }
  // 追加し終わったらトップページに戻るのじゃ
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
