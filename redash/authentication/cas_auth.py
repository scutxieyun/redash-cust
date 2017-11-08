import logging
import requests
from flask import redirect, url_for, Blueprint, request, session
from redash.authentication.google_oauth import create_and_login_user
from redash.authentication.org_resolving import current_org
from redash.authentication import pycas
from redash import settings

logger = logging.getLogger('cas_auth')

blueprint = Blueprint('cas_auth', __name__)

@blueprint.route("/cas/login")
def cas_login():
    if current_org == None and not settings.MULTI_ORG:
        return redirect('/setup')
    elif current_org == None:
        return redirect('/')
    next_path = request.args.get('next')
    if not settings.CAS_SERVER and not settings.SERVICE_URL:
        logger.error("CAS Server or SERVICE URL not set")
        return redirect(url_for('redash.login'))
    status, id, cookie = pycas.login(settings.CAS_SERVER, settings.SERVICE_URL, secure=0, opt="gateway")
    if not pycas.CAS_OK == status:
        logger.error("CAS Login failed")
        if pycas.CAS_REDIRECT == status:
            return redirect(settings.CAS_SERVER + "/cas/login?service=" + settings.SERVICE_URL, code = 302)
        return redirect(url_for('redash.index'))
    set_dev_tag(id)
    logger.debug(session)
    create_and_login_user(current_org,id,session['email'])
    return redirect(next_path or url_for('redash.index'), code=302)
@blueprint.route("/cas/logout")
def cas_logout():
    if not settings.CAS_SERVER and not settings.SERVICE_URL:
        logger.error("CAS Server or SERVICE URL not set")
        return redirect(url_for('redash.index'))
    return redirect(settings.CAS_SERVER + "/cas/logout", code = 302)

def set_dev_tag(id):
    if settings.DEV_MEMBERS is not None:
        logger.debug(settings.DEV_MEMBERS + "   " + id)
        if settings.DEV_MEMBERS.find(id) >= 0:
            session['dev'] = "true"
        else:
            session['dev'] = 'false'
            