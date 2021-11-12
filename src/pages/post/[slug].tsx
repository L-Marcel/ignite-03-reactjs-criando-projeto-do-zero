import { GetStaticPaths, GetStaticProps } from 'next';

import { FiCalendar, FiUser, FiClock } from "react-icons/fi";
import { getPrismicClient } from '../../services/prismic';
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";

import commonStyles from '../../styles/common.module.scss';
import { dateFormat } from '../../utils/dateFormat';
import styles from './post.module.scss';
import Prismic from "@prismicio/client";
import Header from '../../components/Header';
import { RichText } from "prismic-dom";
import { useEffect } from 'react';
import { dateTime } from '../../utils/timeFormat';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}
interface PostProps {
  post: Post;
  preview: boolean;
  prevpost: { 
    title: string;
    uid: string;
  } | null, 
  nextpost: { 
    title: string;
    uid: string;
  } | null
}

export default function Post({ post, preview, nextpost, prevpost }: PostProps) {
  const router = useRouter();

  if(router.isFallback){
    return (
      <>
        <Head>
          <title>Carregando | Spacetraveling</title>
        </Head>
        <main className={`${commonStyles.page} ${styles.container}`}>
          <h1>Carregando...</h1>
        </main>
      </>
    );
  };

  useEffect(() => {
    let script = document.createElement("script");
    let anchor = document.getElementById("comments");
    script.setAttribute("src", "https://utteranc.es/client.js");
    script.setAttribute("crossorigin","anonymous");
    script.setAttribute("async", "true");
    script.setAttribute("repo", "L-Marcel/ignite-03-reactjs-criando-projeto-do-zero");
    script.setAttribute("issue-term", "pathname");
    script.setAttribute("theme", "photon-dark");
    anchor.appendChild(script);
  }, []);

  const time = post.data.content.reduce((count, item) => {
    let perMinute = 200;
    let head = String(item.heading).split(" ").length;
    let body = RichText.asText(item.body);
    let value = body.split(" ").length + head;

    count += ((value) / perMinute);

    return count;
  }, 0);

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>
      <main className={`${commonStyles.page} ${styles.container}`}>
        <div>
          <Header/>
        </div>
        <div className={styles.banner}>
          <span className={styles.overlay}/>
          <img src={post.data.banner.url} alt="banner"/>
        </div>
        <div className={styles.post}>
          <section className={styles.titleSection}>
            <h1>{post.data.title}</h1>
            <div className={commonStyles.info}>
              <FiCalendar/>
              <time>{dateFormat(new Date(post.first_publication_date))}</time>
              <FiUser/>
              <p>{post.data.author}</p>
              <FiClock/>
              <time>{Math.ceil(time)} min</time>
            </div>
            <div className={commonStyles.info}>
              <p>Atualizado em {dateTime(post.last_publication_date? new Date(post.last_publication_date):new Date(post.first_publication_date))}</p>
            </div>
          </section>
          {
            post.data.content.map((content, i) => {
              const body = RichText.asHtml(content.body);

              return (
                <section key={`${i}-${content.heading}`}>
                  <h1>{content.heading}</h1>
                  <div dangerouslySetInnerHTML={{ __html: body }}></div>
                </section>
              );
            })
          }
          <hr/>
          <section className={styles.buttonGroup}>
            { prevpost && <div>
              <p>{prevpost.title}</p>
              <Link href={`/post/${prevpost.uid}`}>
                <a>Post anterior</a>
              </Link>
            </div> } 
            { nextpost && <div>
              <p>{nextpost.title}</p>
              <Link href={`/post/${nextpost.uid}`}>
                <a>Próximo post</a>
              </Link>
            </div> }
          </section>
          <section>
            <div id="comments"></div>
          </section>
          {
            preview && (
              <aside className={commonStyles.preview}>
                <Link href="/api/exit-preview">
                  <a>Sair do modo Preview</a>
                </Link>
              </aside>
            )
          }
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at("document.type", "post"),
    { orderings: '[document.first_publication_date desc]' }
  );

  return {
    paths: posts.results.map(post => {
      return {
        params: {
          slug: post.uid
        }
      };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID("post", String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevpost = await prismic.query(
    Prismic.predicates.at("document.type", "post"),
    {
      ref: previewData?.ref ?? null,
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]'
    }
  ).then(res => {
    let item = res.results[0];

    if(item.id !== response.id) {
      return { 
        title: item.data.title,
        uid: item.uid
      };
    };

    return null;
  }).catch(() => {
    return null;
  });

  const nextpost = await prismic.query(
    Prismic.predicates.at("document.type", "post"),
    {
      ref: previewData?.ref ?? null,
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]'
    }
  ).then(res => {
    let item = res.results[0];

    if(item.id !== response.id) {
      return { 
        title: item.data.title,
        uid: item.uid
      };
    };

    return null;
  }).catch(() => {
    return null;
  });

  const post = response.data;

  return {
    props: {
      post: {
        first_publication_date: response.first_publication_date,
        last_publication_date: response.last_publication_date,
        data: {
          title: post.title,
          subtitle: post.subtitle,
          author: post.author,
          banner: {
            url: post.banner.url
          },
          content: post.content
        },
        uid: response.uid
      },
      preview,
      prevpost,
      nextpost
    } as PostProps,
    revalidate: 60 * 60
  };
};
