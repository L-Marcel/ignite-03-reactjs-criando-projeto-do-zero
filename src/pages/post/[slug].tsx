import { GetStaticPaths, GetStaticProps } from 'next';

import { FiCalendar, FiUser, FiClock } from "react-icons/fi";
import { getPrismicClient } from '../../services/prismic';
import Head from "next/head";
import { useRouter } from "next/router";

import commonStyles from '../../styles/common.module.scss';
import { dateFormat } from '../../utils/dateFormat';
import styles from './post.module.scss';
import Prismic from "@prismicio/client";
import Header from '../../components/Header';
import { RichText } from "prismic-dom";

interface Post {
  first_publication_date: string | null;
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

type Time = {
  content: {
    heading: string;
    body: {
      text: string;
    }[];
  }[];
  time: number;
};

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
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

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID("post", String(slug), {});
  const post = response.data;

  return {
    props: {
      post: {
        first_publication_date: response.first_publication_date,
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
      }
    } as PostProps,
    revalidate: 60 * 60
  };
};
