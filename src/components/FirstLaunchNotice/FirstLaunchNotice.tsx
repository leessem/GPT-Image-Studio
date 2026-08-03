// ============================================================================
// File : src/components/FirstLaunchNotice/FirstLaunchNotice.tsx
//
// Shown exactly once, ever, on the very first launch after install -
// Workspace.tsx only renders this when main.ts's persisted
// `firstLaunchNoticeShown` flag is still false, and acknowledging it
// (the only action available) marks that flag true so it never
// appears again, even across a full restart.
// ============================================================================

import "./FirstLaunchNotice.css";

interface FirstLaunchNoticeProps {

    onAcknowledge: () => void;

}

export default function FirstLaunchNotice({
    onAcknowledge,
}: FirstLaunchNoticeProps) {

    return (

        <div className="first-launch-overlay">

            <div className="first-launch-modal">

                <div className="first-launch-title">
                    GPT Image Studio
                </div>

                <p className="first-launch-message">
                    본 프로그램은 개인용 비상업적 목적으로
                    제작되었습니다.
                    <br />
                    <br />
                    제작자의 사전 허가 없이 본 프로그램의 무단 복제,
                    무단 배포 및 무단 판매를 금합니다.
                </p>

                <p className="first-launch-created-by">
                    Created by
                    <br />
                    leessem
                </p>

                <div className="first-launch-actions">

                    <button onClick={onAcknowledge}>
                        확인
                    </button>

                </div>

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
