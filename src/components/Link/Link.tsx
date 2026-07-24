import { Anchor } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { Link as RouterLink } from "react-router";

type Props = {
  children: React.ReactNode;
  href: string;
} & React.HTMLAttributes<HTMLAnchorElement>;

const Link: React.FC<Props> = (props) => {
  const { children, href, ...rest } = props;

  // 外部リンクはReact Routerのクライアント遷移に乗せず、別タブで開く
  if (href.startsWith("http")) {
    return (
      <Anchor c="blue" href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
        <IconExternalLink />
      </Anchor>
    );
  }

  return (
    <Anchor c="blue" component={RouterLink} to={href} {...rest}>
      {children}
    </Anchor>
  );
};

export default Link;
