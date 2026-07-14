import Image from "next/image";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const justRegistered = params.registered === "1";

  return (
    <section className="_social_login_wrapper _layout_main_wrapper">
      <div className="_shape_one">
        <Image
          src="/images/shape1.svg"
          alt=""
          className="_shape_img"
          width={200}
          height={200}
        />
        <Image
          src="/images/dark_shape.svg"
          alt=""
          className="_dark_shape"
          width={200}
          height={200}
        />
      </div>
      <div className="_shape_two">
        <Image
          src="/images/shape2.svg"
          alt=""
          className="_shape_img"
          width={200}
          height={200}
        />
        <Image
          src="/images/dark_shape1.svg"
          alt=""
          className="_dark_shape _dark_shape_opacity"
          width={200}
          height={200}
        />
      </div>
      <div className="_shape_three">
        <Image
          src="/images/shape3.svg"
          alt=""
          className="_shape_img"
          width={200}
          height={200}
        />
        <Image
          src="/images/dark_shape2.svg"
          alt=""
          className="_dark_shape _dark_shape_opacity"
          width={200}
          height={200}
        />
      </div>
      <div className="_social_login_wrap">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_login_left">
                <div className="_social_login_left_image">
                  <Image
                    src="/images/login.png"
                    alt="Login illustration"
                    className="_left_img"
                    width={800}
                    height={600}
                    priority
                  />
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_login_content">
                <div className="_social_login_left_logo _mar_b28">
                  <Image
                    src="/images/logo.svg"
                    alt="Buddy Script logo"
                    className="_left_logo"
                    width={160}
                    height={40}
                  />
                </div>
                <p className="_social_login_content_para _mar_b8">
                  Welcome back
                </p>
                <h4 className="_social_login_content_title _titl4 _mar_b50">
                  Login to your account
                </h4>
                {justRegistered && (
                  <p
                    className="_social_login_content_para _mar_b40"
                    role="status"
                    style={{ color: "#16a34a" }}
                  >
                    Account created successfully. Please log in.
                  </p>
                )}
                <button
                  type="button"
                  className="_social_login_content_btn _mar_b40"
                >
                  <Image
                    src="/images/google.svg"
                    alt="Google"
                    className="_google_img"
                    width={20}
                    height={20}
                  />
                  <span>Or sign-in with google</span>
                </button>
                <div className="_social_login_content_bottom_txt _mar_b40">
                  <span>Or</span>
                </div>
                <LoginForm />
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_social_login_bottom_txt">
                      <p className="_social_login_bottom_txt_para">
                        Dont have an account?{" "}
                        <Link href="/registration">Create New Account</Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
