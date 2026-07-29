import { Button, type ButtonProps } from "@mantine/core";
import { Link as RouterLink } from "react-router";

export type Props = {
  children: React.ReactNode;
  href: string;
  className?: string;
} & ButtonProps;

const ButtonLink: React.FC<Props> = (props) => {
  const { children, href, className, ...rest } = props;

  // 外部リンクはReact Routerのクライアント遷移に乗せず、別タブで開く
  if (href.startsWith("http")) {
    return (
      <Button
        component="a"
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button component={RouterLink} to={href} className={className} {...rest}>
      {children}
    </Button>
  );
};

export default ButtonLink;
