import { Link as RouterLink } from "react-router";

type Props = {
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * Href を受け取るリンク
 *
 * React Router の Link は `to` を受け取るため、Mantineの `component` プロパティに渡す用途で `href` を `to`
 * に読み替えます。外部URLの場合は素のアンカーを描画します。
 */
const ClientLink: React.FC<Props> = ({ href, children, ...rest }) => {
  if (href.startsWith("http")) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <RouterLink to={href} {...rest}>
      {children}
    </RouterLink>
  );
};

export default ClientLink;
