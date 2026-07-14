"use client";

import { useActionState } from "react";

import { loginAction } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/types";

const initialState: AuthFormState = {};

export const LoginForm = () => {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form className="_social_login_form" action={formAction}>
      <div className="row">
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_login_form_input _mar_b14">
            <label htmlFor="email" className="_social_login_label _mar_b8">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="form-control _social_login_input"
              defaultValue="ayan@gmail.com"
            />
            {state.errors?.email && (
              <p className="_social_login_error" aria-live="polite">
                {state.errors.email[0]}
              </p>
            )}
          </div>
        </div>
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_login_form_input _mar_b14">
            <label htmlFor="password" className="_social_login_label _mar_b8">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="form-control _social_login_input"
              defaultValue="Password1!"
            />
            {state.errors?.password && (
              <p className="_social_login_error" aria-live="polite">
                {state.errors.password[0]}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
          <div className="form-check _social_login_form_check">
            <input
              className="form-check-input _social_login_form_check_input"
              type="checkbox"
              name="rememberMe"
              id="rememberMe"
              defaultChecked
            />
            <label
              className="form-check-label _social_login_form_check_label"
              htmlFor="rememberMe"
            >
              Remember me
            </label>
          </div>
        </div>
        <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
          <div className="_social_login_form_left">
            <p className="_social_login_form_left_para">Forgot password?</p>
          </div>
        </div>
      </div>
      {state.message && (
        <div className="row">
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <p className="_social_login_error" role="alert">
              {state.message}
            </p>
          </div>
        </div>
      )}
      <div className="row">
        <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
          <div className="_social_login_form_btn _mar_t40 _mar_b60">
            <button
              type="submit"
              className="_social_login_form_btn_link _btn1"
              disabled={pending}
            >
              {pending ? "Logging in..." : "Login now"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
