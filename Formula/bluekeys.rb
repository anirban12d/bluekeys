class Bluekeys < Formula
  desc "A feature-rich terminal typing test inspired by Monkeytype"
  homepage "https://github.com/anirban12d/bluekeys"
  version "1.3.1"
  license "GPL-3.0-or-later"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/anirban12d/bluekeys/releases/download/v#{version}/bluekeys-darwin-arm64.tar.gz"
      sha256 "1cd26671764a3cc7ec30e8d6ee1deb4425a05b32ea49c07b2fa5efe169f5e138"
    else
      url "https://github.com/anirban12d/bluekeys/releases/download/v#{version}/bluekeys-darwin-x64.tar.gz"
      sha256 "ba8ffe85f556d266164a695ada01966ac26ac5cf2d18ef60dacb53077b6fff77"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/anirban12d/bluekeys/releases/download/v#{version}/bluekeys-linux-arm64.tar.gz"
      sha256 "d1da3dbe2398a7c9970dec9918ca617a092c0a39032f6b2b3774da9250b0dd12"
    else
      url "https://github.com/anirban12d/bluekeys/releases/download/v#{version}/bluekeys-linux-x64.tar.gz"
      sha256 "99e6619f53e534ff73e9cae98bc8e0f85d6902e4c302dc88cb0865ec89ddfe01"
    end
  end

  def install
    bin.install "bluekeys"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/bluekeys --version")
  end
end
