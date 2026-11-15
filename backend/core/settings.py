from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=Path(__file__).parent.parent / ".env", extra="ignore")

    supabase_url: str
    supabase_secret_key: str
    jwt_secret: str
    jwt_expires_hours: int = 168
    cors_origins: str = ""

    # WooCommerce store that receives PCB orders (empty = ordering disabled)
    wc_url: str = ""
    wc_key: str = ""
    wc_secret: str = ""
    wc_product_id: int = 0
    gerber_bucket: str = "gerbers"
    wc_webhook_secret: str = ""
    max_upload_mb: int = 50
    direct_upload: bool = True  # the browser sends Gerber zips straight to storage; needed where request bodies are capped

    @property
    def woo_enabled(self) -> bool:
        return bool(self.wc_url and self.wc_key and self.wc_secret and self.wc_product_id)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
