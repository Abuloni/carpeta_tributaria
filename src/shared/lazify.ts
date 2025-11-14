import { type ActionFunction, type LoaderFunction } from "react-router";

type ImportType<T> = {
  default : React.ComponentType<T> & {
    loader? : LoaderFunction<T>,
    action? : ActionFunction<T>
  },
  [key: string]: unknown
}

type LazyType<T> = {
  loader : LoaderFunction<T> | undefined,
  action : ActionFunction<T> | undefined,
  Component : React.ComponentType<T>,
  [key: string]: unknown
}

export function lazify<T>(imported: ImportType<T>) : LazyType<T> {
  const { default : Component, ...rest  } = imported;
  return {
    loader : Component.loader,
    action : Component.action,
    Component,
    ...rest
  };
}