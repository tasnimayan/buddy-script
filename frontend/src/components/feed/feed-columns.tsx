import { FeedList } from "./feed-list";
import { FeedRightSection } from "./feed-right-section";
import { FeedLeftSection } from "./feed-left-section";

export function FeedColumns() {
  return (
    <div className="container _custom_container">
      <div className="_layout_inner_wrap">
        <div className="row">
          {/*Left Sidebar*/}
          <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
            <FeedLeftSection />
          </div>

          {/*Layout Middle*/}
          <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
            <FeedList />
          </div>

          {/*Right Sidebar*/}
          <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
            <FeedRightSection />
          </div>
        </div>
      </div>
    </div>
  );
}
