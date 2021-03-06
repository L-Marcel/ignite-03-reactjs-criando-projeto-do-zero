import styles from "./header.module.scss";
import Link from "next/link";

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/">
        <img src="/Logo.svg" alt="logo"/>
      </Link>
    </header>
  );
}
